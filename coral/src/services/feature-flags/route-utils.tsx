import { useToast } from "@aivenio/aquarium";
import { useEffect } from "react";
import { Navigate, RouteObject } from "react-router-dom";
import { useAuthContext } from "src/app/context-provider/AuthProvider";
import { Routes } from "src/app/router_utils";
import { FeatureFlag } from "src/services/feature-flags/types";
import { isFeatureFlagActive } from "src/services/feature-flags/utils";

type Args = {
  path: Routes;
  element: JSX.Element;
  featureFlag: FeatureFlag;
  redirectRouteWithoutFeatureFlag: Routes;
  children?: RouteObject[];
};

type PrivateArgs = {
  path: Routes;
  element: JSX.Element;
  permission: string;
  children?: RouteObject[];
};

function createRouteBehindFeatureFlag({
  path,
  element,
  featureFlag,
  redirectRouteWithoutFeatureFlag,
  children,
}: Args): RouteObject {
  return {
    path: path,
    // if FEATURE_FLAG_<name> is not set to
    // true, we're not even rendering the page but
    // redirect user directly to /topics
    element: isFeatureFlagActive(featureFlag) ? (
      element
    ) : (
      <Navigate to={redirectRouteWithoutFeatureFlag} />
    ),
    ...(children && { children }),
  };
}

const PrivateRoute = ({
  children,
  permission,
}: {
  children: React.ReactNode;
  permission: string;
}) => {
  const { permissions } = useAuthContext();
  const toast = useToast();
  const isAuthorized = permissions[permission];

  useEffect(() => {
    if (!isAuthorized) {
      toast({
        message: `Not authorized: ${permission}`,
        position: "bottom-left",
        variant: "danger",
      });

      return;
    }
  }, []);

  return isAuthorized ? children : <Navigate to="/" replace />;
};
function createPrivateRoute({
  path,
  element,
  permission,
  children,
}: PrivateArgs): RouteObject {
  return {
    path: path,
    element: <PrivateRoute permission={permission}>{element}</PrivateRoute>,
    ...(children && { children }),
  };
}

export { createPrivateRoute, createRouteBehindFeatureFlag };
