import {
  defineMiddlewares,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

function redirectRootToAdmin(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  if (req.originalUrl === "/" || req.originalUrl === "") {
    return res.redirect(302, "/app")
  }
  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: /^\/.*/,
      middlewares: [redirectRootToAdmin],
    },
  ],
})
