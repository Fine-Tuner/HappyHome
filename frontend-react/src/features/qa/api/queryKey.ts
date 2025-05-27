const queryKeys = {
  all: ["qa"] as const,
  list: (skip?: number, limit?: number) => [...queryKeys.all, "list", { skip, limit }] as const,
  detail: (id: string) => [...queryKeys.all, "detail", id] as const,
};

export default queryKeys;
