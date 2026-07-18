import { useEffect } from "react";

/**
 * Registers WebMCP tools via navigator.modelContext.provideContext()
 * so in-browser AI agents can trigger key actions on this site.
 * Spec: https://webmachinelearning.github.io/webmcp/
 */
const WebMCPTools = () => {
  useEffect(() => {
    const nav = navigator as unknown as {
      modelContext?: {
        provideContext: (ctx: {
          tools: Array<{
            name: string;
            description: string;
            inputSchema: Record<string, unknown>;
            execute: (input: unknown) => Promise<unknown> | unknown;
          }>;
        }) => void;
      };
    };

    if (!nav.modelContext?.provideContext) return;

    try {
      nav.modelContext.provideContext({
        tools: [
          {
            name: "start_loan_estimator",
            description:
              "Open the True North business loan estimator quiz to match a small business (US or Canada) with loan offers from $5K to $800K.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            execute: () => {
              window.location.assign("/loan-estimator");
              return { ok: true, url: "/loan-estimator" };
            },
          },
          {
            name: "browse_loan_products",
            description:
              "Navigate to a specific loan product page (equipment financing, small business loans, merchant cash advance, or invoice factoring).",
            inputSchema: {
              type: "object",
              properties: {
                product: {
                  type: "string",
                  enum: [
                    "equipment-financing",
                    "small-business-loans",
                    "merchant-cash-advance",
                    "invoice-factoring",
                  ],
                  description: "Which loan product page to open.",
                },
              },
              required: ["product"],
              additionalProperties: false,
            },
            execute: (input: unknown) => {
              const product = (input as { product?: string })?.product;
              const allowed = new Set([
                "equipment-financing",
                "small-business-loans",
                "merchant-cash-advance",
                "invoice-factoring",
              ]);
              if (!product || !allowed.has(product)) {
                return { ok: false, error: "Invalid product" };
              }
              const url = `/${product}`;
              window.location.assign(url);
              return { ok: true, url };
            },
          },
          {
            name: "view_industries_served",
            description:
              "Open the directory of industries True North Business Loan serves.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            execute: () => {
              window.location.assign("/industries-we-serve");
              return { ok: true, url: "/industries-we-serve" };
            },
          },
          {
            name: "become_a_partner",
            description:
              "Open the partner sign-up flow for lead-buyer / broker partners.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            execute: () => {
              window.location.assign("/partners");
              return { ok: true, url: "/partners" };
            },
          },
        ],
      });
    } catch {
      // WebMCP not available or blocked — silently ignore.
    }
  }, []);

  return null;
};

export default WebMCPTools;
