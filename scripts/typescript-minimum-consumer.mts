import { Result, TaggedError, matchErrorPartial } from "better-result";

class MinimumVersionError extends TaggedError("MinimumVersionError")<{
  message: string;
}> {}

const result = Result.err(new MinimumVersionError({ message: "minimum version smoke test" }));
const message = matchErrorPartial(result.error, {
  MinimumVersionError: (error) => error.message,
});

void message;

const receiver = { value: 42 };
const sync: Result<number, never> = Result.gen(receiver, function* () {
  const value = yield* Result.ok(this.value);
  return Result.ok(value);
});
const async: Promise<Result<number, never>> = Result.gen(receiver, async function* () {
  const value = yield* Result.await(Promise.resolve(Result.ok(this.value)));
  return Result.ok(value);
});

void sync;
void async;
