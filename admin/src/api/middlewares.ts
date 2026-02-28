import { defineMiddlewares } from "@medusajs/framework/http"
import type { NextFunction } from "express"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

function redirectRootToAdmin(
  req: MedusaRequest,
  res: MedusaResponse,
  next: NextFunction
) {
  if (req.path === "/" || req.path === "") {
    return res.redirect(302, "/app")
  }
  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/",
      middlewares: [redirectRootToAdmin],
    },
  ],
})
