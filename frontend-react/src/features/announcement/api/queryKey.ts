const queryKeys = {
  all: ["announcements"],
  list: () => [...queryKeys.all, "list"],
  detail: (id: string) => [...queryKeys.all, id],
};

export default queryKeys;
