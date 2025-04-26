
export interface AlexaRequest {
  version: string;
  session: {
    new: boolean;
    sessionId: string;
    application: {
      applicationId: string;
    };
    user: {
      userId: string;
    };
    attributes?: Record<string, any>;
  };
  request: {
    type: string;
    requestId: string;
    timestamp: string;
    locale: string;
    intent?: {
      name: string;
      slots?: Record<string, {
        name: string;
        value?: string;
      }>;
    };
  };
}

export interface AlexaResponse {
  version: string;
  sessionAttributes?: Record<string, any>;
  response: {
    outputSpeech: {
      type: string;
      text?: string;
      ssml?: string;
    };
    card?: {
      type: string;
      title: string;
      content?: string;
      text?: string;
      image?: {
        smallImageUrl?: string;
        largeImageUrl?: string;
      };
    };
    reprompt?: {
      outputSpeech: {
        type: string;
        text?: string;
        ssml?: string;
      };
    };
    shouldEndSession: boolean;
  };
}
