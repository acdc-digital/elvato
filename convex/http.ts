import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { registerRoutes } from "convex-fs";
import { components } from "./_generated/api";
import { fs } from "./fs";

const http = httpRouter();

// Mount ConvexFS routes at /fs:
//   POST /fs/upload   – Upload proxy for Bunny.net storage
//   GET  /fs/blobs/*  – Returns 302 redirect to signed CDN URL
registerRoutes(http, components.fs, fs, {
  pathPrefix: "/fs",
  uploadAuth: async (ctx) => {
    // Only authenticated users may upload product images
    const identity = await ctx.auth.getUserIdentity();
    return identity !== null;
  },
  downloadAuth: async () => {
    // Product images are public — allow unauthenticated downloads
    return true;
  },
});

// =============================================================================
// SHIPPING WEBHOOK — receives tracking updates from Medusa admin relay
// =============================================================================
http.route({
  path: "/shipping/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate shared secret
    const secret = request.headers.get("x-webhook-secret");
    const expectedSecret = process.env.CONVEX_WEBHOOK_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { action, payload } = body;

    if (action === "create_shipment") {
      await ctx.runMutation(api.shipping.tracking.createShipment, payload);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "update_tracking_status") {
      await ctx.runMutation(
        api.shipping.tracking.updateTrackingStatus,
        payload
      );
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "update_tracking_events") {
      await ctx.runMutation(
        api.shipping.tracking.updateTrackingEvents,
        payload
      );
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "link_cj_order") {
      await ctx.runMutation(api.shipping.tracking.linkCjOrder, payload);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
