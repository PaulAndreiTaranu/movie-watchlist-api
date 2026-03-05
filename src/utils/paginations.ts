export const parsePagination = (query: { page?: string; limit?: string }) => {
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(Number(query.limit) || 20))
    const skip = (page - 1) * limit

    return { page, limit, skip }
}
