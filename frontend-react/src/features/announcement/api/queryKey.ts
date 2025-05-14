const queryKeys = {
  all: ["announcements"],
  list: (params?: unknown) => [...queryKeys.all, "list", params],
  detail: (id: string) => [...queryKeys.all, id],
};

export default queryKeys;
