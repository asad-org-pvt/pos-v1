/**
 * Runtime tenant state holder.
 * Allows repository and service layers to access the verified active tenant context
 * without relying on static module-load localStorage evaluation.
 */

let activeTenantId: string = "default";

export const setRuntimeTenantId = (tenantId: string): void => {
  if (tenantId && tenantId.trim() !== "") {
    activeTenantId = tenantId.trim();
  }
};

export const getRuntimeTenantId = (): string => {
  return activeTenantId;
};

export const clearRuntimeTenantId = (): void => {
  activeTenantId = "default";
};
