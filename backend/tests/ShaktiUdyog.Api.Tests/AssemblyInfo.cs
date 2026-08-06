using Xunit;

// Integration tests share a single local SQL Server development database and
// seed users (e.g. the dev admin). xUnit runs test classes in parallel by
// default, which causes optimistic-concurrency failures when two hosts update
// the same seeded row (e.g. AccessFailedCount on the dev admin during login).
// Serialize the suite: correctness over wall-clock for these integration tests.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
