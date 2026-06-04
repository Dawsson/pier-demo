import { describeAiGatewayUniversalRequest, forwardAiGatewayResponse } from "@waypoint/backend";
import { guestProcedure, publicEndpointProcedure } from "../procedures";

export const aiGatewayDescriptionQuery = guestProcedure.aiGatewayDescription.query({
  run: async () => {
    const description = describeAiGatewayUniversalRequest([
      {
        body: {
          messages: [{ content: "Example prompt body stays out of logs.", role: "user" }],
          model: "@cf/meta/llama-3.1-8b-instruct",
          stream: true,
        },
        headers: { "cf-aig-cache-ttl": "300" },
        provider: "workers-ai",
      },
    ]);

    return {
      ...description,
      providers: [...description.providers],
    };
  },
});

export const aiGatewayForwardingEndpoint = publicEndpointProcedure.endpoint({
  method: "GET",
  path: "/events/ai-gateway",
  run: () => {
    const description = describeAiGatewayUniversalRequest(exampleProviders);

    return forwardAiGatewayResponse(mockGatewayResponse(), { description });
  },
});

const exampleProviders = [
  {
    body: {
      messages: [{ content: "Example prompt body stays out of logs.", role: "user" }],
      model: "@cf/meta/llama-3.1-8b-instruct",
      stream: true,
    },
    headers: { "cf-aig-cache-ttl": "300" },
    provider: "workers-ai",
  },
] as const;

const mockGatewayResponse = () =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode("Waypoint forwards "));
        controller.enqueue(encoder.encode("AI Gateway bytes as browser-safe SSE."));
        controller.close();
      },
    }),
    { status: 200 },
  );
