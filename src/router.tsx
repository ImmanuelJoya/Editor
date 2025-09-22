import {
  Router,
  Route,
  RootRoute,
  Outlet,
} from "@tanstack/react-router";
import Editor from "./routes/editor";

const rootRoute = new RootRoute({
  component: () => (
    <div>
      <Outlet />
    </div>
  ),
});

const editorRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Editor,
});

export const router = new Router({
  routeTree: rootRoute.addChildren([editorRoute]),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
