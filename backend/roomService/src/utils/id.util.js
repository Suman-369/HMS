/** Compare Mongo ObjectIds whether stored as ObjectId, string, or populated doc. */
export function sameId(a, b) {
  const sa = a == null ? "" : String(a._id ?? a);
  const sb = b == null ? "" : String(b._id ?? b);
  return sa === sb && sa !== "";
}
