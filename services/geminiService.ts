import { GoogleGenAI, Modality, Type, LiveServerMessage, FunctionDeclaration, Tool } from "@google/genai";
import { EventData, PackingList, CocktailRecipe, IngredientType } from "../types";

// Initialize the client
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to summarize all events for the dashboard context
// UPDATED: Now includes FULL details (Location, Address, Rentals, etc.) so AI knows everything.
const getDashboardSummary = (events: EventData[]) => {
    return events.map(e => `
    [EVENT ID: ${e.id}]
    - Client: ${e.clientName} (Phone: ${e.clientPhone || 'N/A'})
    - Date: ${e.eventDate.split('T')[0]} | Time: ${e.eventDate.split('T')[1]?.slice(0,5)} - ${e.endTime.split('T')[1]?.slice(0,5)}
    - Location: ${e.location}
    - Status: ${e.status} | Payment: ${e.isPaid ? 'PAID' : 'UNPAID'}
    - Headcount: ${e.headcount} | Type: ${e.eventType}
    - Bartender: ${e.bartender.name} (${e.bartender.email})
    - Rentals: Bar: ${e.barRental.required ? `Yes (${e.barRental.size} ${e.barRental.color})` : 'No'}; Glass: ${e.glassRental.required ? 'Yes' : 'No (Plastic)'}
    - Cocktails: ${e.cocktailSelections.join(', ') || 'None selected'}
    `).join('\n-----------------------------------\n');
};

// Shared System Context Generator
const getSystemContext = (context: EventData | EventData[]) => {
    const isDashboard = Array.isArray(context);

    if (isDashboard) {
        const events = context as EventData[];
        return `
            You are the Event Operations Manager for MTL Craft Cocktails.
            You are currently on the GLOBAL DASHBOARD view.
            
            Here is the FULL list of active events and their details:
            ${getDashboardSummary(events)}

            Capabilities in this mode:
            1. You have access to ALL details (Location, Phone, Address, Cocktails) for every event listed above.
            2. If asked "What is Sarah's address?", look at the Location field for Sarah.
            3. If asked about unpaid invoices, check the Payment status.
            4. To generate a packing list or edit specific details, you might need to ask the user to "Open the event" first, or use the tools if supported.
            
            Answer questions directly and concisely based on the data provided.
        `;
    } else {
        const eventContext = context as EventData;
        return `
            You are an expert bartender assistant for MTL Craft Cocktails.
            Current Event: ${eventContext.clientName} at ${eventContext.location}.
            Time: ${eventContext.eventDate} - ${eventContext.endTime}.
            Headcount: ${eventContext.headcount}.
            Bartender: ${eventContext.bartender.name} (${eventContext.bartender.email}).
            Rentals: Bar - ${eventContext.barRental.required ? `Yes (${eventContext.barRental.size}, ${eventContext.barRental.color})` : 'No'}, Glass - ${eventContext.glassRental.required ? 'Yes' : 'No (Plastic)'}.
            Selected Cocktails: ${eventContext.cocktailSelections.join(", ")}.
            Status: ${eventContext.status}.
            
            Capabilities:
            1. Manage Cocktails: Add or remove cocktails.
            2. Manage Rentals: Add/Remove Bar rentals, Switch Glassware/Plastic.
            3. Update Details: Change client, location, times, bartender.
            4. Recipes: Add new recipes.
            5. Packing List: Generate based on current data.
            6. Email: Send brief/packing list.
            
            When asked to "change to plastic", use updateRentalItems with action='reset' and itemType='glass'.
            When asked to "remove bar", use updateRentalItems with action='remove' and itemType='bar'.
            When asked to "email the team", use the sendEmail tool.
            
            Be professional, concise, and helpful.
        `;
    }
};

// Shared Tools Definition
const getTools = (): Tool[] => [
    {
      functionDeclarations: [
        {
          name: "updateHeadcount",
          description: "Update the guest count for the event.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              newCount: { type: Type.NUMBER, description: "The new number of guests" }
            },
            required: ["newCount"]
          }
        },
        {
          name: "generatePackingList",
          description: "Calculate and generate the packing list for the current event.",
          parameters: {
             type: Type.OBJECT,
             properties: {},
          }
        },
        {
            name: "addRecipe",
            description: "Add a new cocktail recipe to the application menu.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Name of the cocktail" },
                    englishDescription: { type: Type.STRING, description: "Short description" },
                    method: { type: Type.STRING, description: "Preparation method" },
                    ingredients: { 
                        type: Type.ARRAY, 
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                type: { type: Type.STRING, description: "One of: alcohol, syrup, juice, garnish, glass, soda, others" },
                                quantityPerDrink: { type: Type.NUMBER },
                                unit: { type: Type.STRING }
                            },
                            required: ["name", "type", "quantityPerDrink", "unit"]
                        }
                    }
                },
                required: ["name", "ingredients"]
            }
        },
        {
            name: "updateEventCocktails",
            description: "Add or remove cocktails from the current event's selection.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    action: { type: Type.STRING, enum: ["add", "remove"], description: "Whether to add or remove" },
                    cocktailName: { type: Type.STRING, description: "Name of the cocktail" }
                },
                required: ["action", "cocktailName"]
            }
        },
        {
            name: "updateEventDetails",
            description: "Update general details of the event like location, client name, status, or bartender info.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    field: { type: Type.STRING, enum: ["location", "clientName", "status", "bartenderName", "bartenderEmail", "eventDate", "endTime"], description: "Field to update" },
                    value: { type: Type.STRING, description: "New value" }
                },
                required: ["field", "value"]
            }
        },
        {
            name: "updateRentalItems",
            description: "Update rental items for the event (Bar or Glassware). Use 'reset' action for glassware to switch to plastic.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    action: { type: Type.STRING, enum: ["add", "remove", "update", "reset"], description: "Action to perform" },
                    itemType: { type: Type.STRING, enum: ["bar", "glass"], description: "Type of rental" },
                    subtype: { type: Type.STRING, description: "Optional: color or size for bar, or specific glass type" },
                    quantity: { type: Type.NUMBER, description: "Optional: quantity for glassware" }
                },
                required: ["action", "itemType"]
            }
        },
        {
            name: "sendEmail",
            description: "Open the user's email client with the packing list and event brief ready to send.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    recipientName: { type: Type.STRING, description: "Name of the recipient (optional)" }
                }
            }
        }
      ]
    }
];

export const connectToLiveApi = async (
  onAudioData: (base64: string) => void,
  onTranscription: (text: string, isUser: boolean) => void,
  context: EventData | EventData[],
  toolsHandlers: {
      onUpdateHeadcount: (count: number) => void;
      onGenerateList: () => void;
      onAddRecipe: (recipe: CocktailRecipe) => void;
      onUpdateCocktails: (action: 'add' | 'remove', name: string) => void;
      onUpdateDetails: (field: string, value: string) => void;
      onUpdateRental: (action: string, itemType: string, subtype?: string, quantity?: number) => void;
      onSendEmail: (recipientName?: string) => void;
  }
) => {
    try {
        let currentModelTurnBuffer = "";
        let currentUserTurnBuffer = "";

        // Use stable Gemini 2.0 Flash Exp for Live API reliability
        const session = await genAI.live.connect({
            model: "gemini-2.0-flash-exp",
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: getSystemContext(context),
                tools: getTools(),
                inputAudioTranscription: {},
            },
            callbacks: {
                onopen: () => console.log("Live API Connected"),
                onclose: () => console.log("Live API Closed"),
                onerror: (e) => {
                    console.error("Live API Error:", e);
                    onTranscription("System Error: The voice service is currently unavailable. Please try again.", false);
                },
                onmessage: (msg: LiveServerMessage) => {
                    // 1. Handle Audio Output (Stream immediately)
                    const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) onAudioData(audioData);

                    // 2. Handle Text Output (BUFFER IT)
                    const textPart = msg.serverContent?.modelTurn?.parts?.find(p => p.text)?.text;
                    if (textPart) {
                        currentModelTurnBuffer += textPart;
                    }

                    // 3. Handle Turn Complete (FLUSH BUFFER)
                    if (msg.serverContent?.turnComplete) {
                         if (currentModelTurnBuffer.trim()) {
                             onTranscription(currentModelTurnBuffer, false);
                             currentModelTurnBuffer = "";
                         }
                    }

                    // 4. Handle User Input (Input Buffering)
                    const userTranscript = msg.serverContent?.inputTranscription?.text;
                    if (userTranscript) {
                        currentUserTurnBuffer += userTranscript; 
                    }
                    
                    // If model starts responding or calls a tool, we assume user turn is over.
                    if (audioData || textPart || msg.toolCall) {
                        if (currentUserTurnBuffer.trim()) {
                             // Logic to handle final user transcript if needed by UI
                        }
                    }

                    // 5. Handle Tool Calls
                    if (msg.toolCall) {
                        for (const fc of msg.toolCall.functionCalls) {
                            console.log("Tool call:", fc.name, fc.args);
                            try {
                                switch (fc.name) {
                                    case "updateHeadcount":
                                        toolsHandlers.onUpdateHeadcount(fc.args.newCount as number);
                                        break;
                                    case "generatePackingList":
                                        toolsHandlers.onGenerateList();
                                        break;
                                    case "addRecipe":
                                        // @ts-ignore
                                        toolsHandlers.onAddRecipe(fc.args as CocktailRecipe);
                                        break;
                                    case "updateEventCocktails":
                                        toolsHandlers.onUpdateCocktails(fc.args.action as any, fc.args.cocktailName as string);
                                        break;
                                    case "updateEventDetails":
                                        toolsHandlers.onUpdateDetails(fc.args.field as string, fc.args.value as string);
                                        break;
                                    case "updateRentalItems":
                                        toolsHandlers.onUpdateRental(fc.args.action as string, fc.args.itemType as string, fc.args.subtype as string, fc.args.quantity as number);
                                        break;
                                    case "sendEmail":
                                        toolsHandlers.onSendEmail(fc.args.recipientName as string);
                                        break;
                                }
                                
                                // Send success response back to model
                                session.sendToolResponse({
                                    functionResponses: [{
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: "Success" }
                                    }]
                                });
                            } catch (e) {
                                console.error("Tool Execution Error", e);
                            }
                        }
                    }
                },
            }
        });
        
        return session;
    } catch (error) {
        console.error("Connection failed:", error);
        throw error;
    }
};

export const sendChatMessage = async (
    message: string, 
    context: EventData | EventData[],
    toolsHandlers: any
): Promise<string> => {
    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                role: "user",
                parts: [{ text: message }]
            },
            config: {
                systemInstruction: getSystemContext(context),
                tools: getTools()
            }
        });

        // Handle Function Calls in Text Mode
        const candidates = response.candidates;
        if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.functionCall) {
                    const fc = part.functionCall;
                    // Execute the corresponding tool handler
                    switch (fc.name) {
                        case "updateHeadcount":
                            toolsHandlers.onUpdateHeadcount(fc.args.newCount);
                            break;
                        case "generatePackingList":
                            toolsHandlers.onGenerateList();
                            break;
                        case "addRecipe":
                            toolsHandlers.onAddRecipe(fc.args);
                            break;
                        case "updateEventCocktails":
                            toolsHandlers.onUpdateCocktails(fc.args.action, fc.args.cocktailName);
                            break;
                        case "updateEventDetails":
                            toolsHandlers.onUpdateDetails(fc.args.field, fc.args.value);
                            break;
                        case "updateRentalItems":
                            toolsHandlers.onUpdateRental(fc.args.action, fc.args.itemType, fc.args.subtype, fc.args.quantity);
                            break;
                        case "sendEmail":
                            toolsHandlers.onSendEmail(fc.args.recipientName);
                            break;
                    }
                    return `I've updated the event as requested.`;
                }
            }
        }

        return response.text || "I didn't catch that.";
    } catch (error) {
        return "Sorry, I'm having trouble connecting to the network.";
    }
};

export const askReasoningModel = async (prompt: string, context: EventData | EventData[]): Promise<string> => {
    try {
        const response = await genAI.models.generateContent({
            model: "gemini-3-pro-preview", 
            contents: {
                role: "user",
                parts: [{ text: `Context: ${JSON.stringify(context)}. Question: ${prompt}` }]
            },
            config: {
                thinkingConfig: { thinkingBudget: 32768 } 
            }
        });
        return response.text || "No reasoning available.";
    } catch (error) {
        return "I couldn't process that thought right now.";
    }
};