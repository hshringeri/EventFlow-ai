import { Configuration, OpenAIApi } from "openai";
import {getCalendarData, getOpenSlots} from "./timeSlots.js"
import moment from 'moment';

const axios = require("axios");    // For making HTTP requests.


const event1 = "get groceries from walmart"
const event2 = "go to the gym 4 times a week"
const event3 = "study for my OS midterm"
const event4 = "make dinner every day"

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

export async function addEvent(event, userSid) {
    const eventType = await determineEventType(event)
    const today = new Date();
    console.log("Dateee: " + today)
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);

    const formatDate = (date) => {
        return date.toISOString();
    };
    
    if (eventType ===  'errand/chore') {
        const events = await handleSimpleEvent(event)
        if (typeof events == Error) {
            return events
        }
        const newEvents = getOpenSlots(moment(today).add(1, 'days').startOf('day').toISOString(), formatDate(twoWeeksFromNow), events, userSid)
        
        return newEvents;
        
    }
    if (eventType === 'project') {
        const events = await handleProjectEvent(event)
        if (typeof events == Error) {
            return events
        }
        const newEvents = getOpenSlots(moment(today).add(1, 'days').startOf('day').toISOString(), formatDate(twoWeeksFromNow), events, userSid)
        
        return newEvents;
        

    }
    if (eventType === 'learning event') {
        const events = await handleLearningEvent(event)
        if (typeof events == Error) {
            return events
        }
    
        const newEvents = getOpenSlots(moment(today).add(1, 'days').startOf('day').toISOString(), formatDate(twoWeeksFromNow), events, userSid)
        
        return newEvents;
        

    }
    if (eventType === 'activity') {
        const events = await handleSimpleEvent(event)
        if (events instanceof Error) {
            return events
        }
        const newEvents = getOpenSlots(moment(today).add(1, 'days').startOf('day').toISOString(), formatDate(twoWeeksFromNow), events, userSid)
        
        return newEvents;
        
    }
    if (eventType === 'homework') {
        const events = await handleProjectEvent(event)
        if (events instanceof Error) {
            return events
        }
        const newEvents = getOpenSlots(moment(today).add(1, 'days').startOf('day').toISOString(), formatDate(twoWeeksFromNow), events, userSid)
        
        return newEvents;
        
    }
    

}

async function determineEventType(event) {
    try {
        console.log(":WE are here")
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{"role": "user", "content": event}],
            functions: [
                {
                    name: "determineEventType",
                    description: "determine what type of event this task is",
                    parameters: {
                        type: "object",
                        properties: {
                            isErrandOrChore: {
                                type: "boolean",
                                description: "Is the event specified an errand or chore"
                            },
                            isALearningEvent: {
                                type: "boolean",
                                description: "Does the event require a learning curve? (studying, learning etc.)"
                            },
                            isAnActivity: {
                                type: "boolean",
                                description: "Is the event an activity? (sports, video games, lunch, dinner, going to gym, exploring, fun things etc)"
                            },
                            isAProject: {
                                type: "boolean",
                                description: "Is the event a project?"
                            },
                            isHomework: {
                                type: "boolean",
                                description: "Is the event Homework?"
                            }
                        }
                        
                    }
                }
            ],
            function_call: "auto"
        })
        console.log("why are ayou stallong")
        console.log(completion.data.choices[0].message.function_call.arguments)
        const completionResponse = completion.data.choices[0].message.function_call.arguments;

        const isErrandOrChore = JSON.parse(completionResponse).isErrandOrChore
        const isALearningEvent = JSON.parse(completionResponse).isALearningEvent
        const isAnActivity = JSON.parse(completionResponse).isAnActivity
        const isAProject = JSON.parse(completionResponse).isAProject
        const isHomework = JSON.parse(completionResponse).isHomework


        if (isErrandOrChore) {
            return 'errand/chore'
        }
        if (isAProject) {
            return 'project'
        }
        if (isALearningEvent) {
            return 'learning event'
        }
        if (isAnActivity) {
            return 'activity'
        }
        if (isHomework) {
            return 'homework'
        }
        

    } catch(err) {
        return Error(err)
    }
}

async function handleSimpleEvent(event) {
    const events = []
    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{"role": "user", "content": event}],
            functions: [
                {
                    name: "handleErrandOrChore",
                    description: "Create calendar events for errands, chores or activities",
                    parameters: {
                        type: "object",
                        properties: {
                            event: {
                                type: "string",
                                description: "Based on the content of the user prompted event, create an event name for the task"
                            },
                            probable_duration: {
                                type: "string",
                                description: "Based on the content of the user prompted event, figure out how long this event on a daily basis"
                            },
                            days_per_week: {
                                type: "integer",
                                description: "Based on the content of the user prompted event, determine how many days per week the user wants this task to be done."
                            },
                            time_of_day: {
                                type: "string",
                                description: "based on the content of the prompt, determine the best time of the day for the task/event.",
                                enum: ["anytime", "morning", "afternoon", "evening"]  
                            }
                        },
                        "required": ["event", "probable_duration", "days_per_week", "time_of_day"]
                    }
                }
            ],
            function_call: "auto"
        })
        try {
            const completionResponse = completion.data.choices[0].message.function_call.arguments;
            events.push(JSON.parse(completionResponse))
        return events
        } catch(error) {
            return Error(error)
        }
        
        
    
    } catch(error) {
        if (error.response) {
            console.log(error.response.status);
            console.log(error.response.data);
          } else {
            console.log(error.message);
            console.log(messages);
          }
          return Error(error)
        
    }

}

async function handleLearningEvent(event) {
    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{"role": "user", "content": event}],
            functions: [
                {
                    name: "handleLearningEvent",
                    description: "Create calendar events for learning events",
                    parameters: {
                        type: "object",
                        properties: {
                            mediums: {
                                type: "array",
                                description: " Based on the content of the learning event, generate a list of ways to go about learning the topic.",
                                items: {
                                    type: "string"
                                }
                            }
                        }
                    }
                }
            ],
            function_call: "auto"
        })

        const completionResponse = completion.data.choices[0].message.function_call.arguments;
        const mediums = JSON.parse(completionResponse).mediums
        console.log("mediums: " + mediums)

        const events = [];

        for (const medium of mediums) {
            const prompt = event + ": " + medium;

            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{"role": "user", "content": prompt}],
                functions: [
                    {
                        name: "handleBrokenDownLearningEvents",
                        description: "Create calendar events",
                        parameters: {
                            type: "object",
                            properties: {
                                event: {
                                    type: "string",
                                    description: "describe the task in a very detailed manner"
                                },
                                probable_duration: {
                                    type: "string",
                                    description: "Based on the content of the user prompted event, figure out how long this event on a daily basis"
                                },
                                days_per_week: {
                                    type: "integer",
                                    description: "Based on the content of the user prompted event, determine how many days per week the user wants this task to be done."
                                },
                                // time_of_day: {
                                //     type: "string",
                                //     description: "based on the content of the prompt, determine the best time of the day for the task/event.",
                                //     enum: ["anytime", "morning", "afternoon", "evening"]  
                                // }
                            },
                            "required": ["event", "probable_duration", "days_per_week"]
                        }
                    }
                ],
                function_call: "auto"
            });

            const completionResponse = completion.data.choices[0].message.function_call.arguments;
            events.push(JSON.parse(completionResponse));
            
        }
        return events;

    } catch (error) {
        console.log(error)
        if (error.response) {
            console.log(error.response.status);
            console.log(error.response.data);
        } else {
            console.log(error.message);

        }
        return Error(error)
    }
}

async function handleProjectEvent(event) {
    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{"role": "user", "content": event}],
            functions: [
                {
                    name: "handleProjectEvent",
                    description: "Create calendar events for learning events",
                    parameters: {
                        type: "object",
                        properties: {
                            mediums: {
                                type: "array",
                                description: " Based on the content of the project or assignment, generate a list of ways to go about the project/assignment.",
                                items: {
                                    type: "string"
                                }
                            }
                        }
                    }
                }
            ],
            function_call: "auto"
        })

        const completionResponse = completion.data.choices[0].message.function_call.arguments;
        const mediums = JSON.parse(completionResponse).mediums

        const events = [];
        for (const medium of mediums) {
            const prompt = event + ": " + medium;

            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{"role": "user", "content": prompt}],
                functions: [
                    {
                        name: "handleBrokenDownProjectEvents",
                        description: "Create calendar events",
                        parameters: {
                            type: "object",
                            properties: {
                                event: {
                                    type: "string",
                                    description: "the content of the this prompt"
                                },
                                probable_duration: {
                                    type: "string",
                                    description: "Based on the content of the user prompted event, figure out how long this event on a daily basis"
                                },
                                days_per_week: {
                                    type: "integer",
                                    description: "Based on the content of the user prompted event, determine how many days per week the user wants this task to be done."
                                }
                                    // },
                                // time_of_day: {
                                //     type: "string",
                                //     description: "based on the content of the prompt, determine the best time of the day for the task/event.",
                                //     enum: ["anytime", "morning", "afternoon", "evening"]  
                                // }
                            },
                            //"required": ["event", "probable_duration", "days_per_week", "time_of_day"]
                            "required": ["event", "probable_duration", "days_per_week"]
                        }
                    }
                ],
                function_call: "auto"
            });

            const completionResponse = completion.data.choices[0].message.function_call.arguments;
            events.push(JSON.parse(completionResponse));
            
        }
        return events;

    } catch (error) {
        console.log(error)
        if (error.response) {
            console.log(error.response.status);
            console.log(error.response.data);
        } else {
            console.log(error.message);

        }
        return Error(error)
    }
}



//addEvent(event4)

// determineEventType(event2)

// determineEventType(event3)

// determineEventType(event4)

 //handleErrandOrChore(event1)
// handleErrandOrChore(event2)
// handleErrandOrChore(event4

//handleLearningEvent("work on personal project")






