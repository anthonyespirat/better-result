import { describe, expectTypeOf, it } from "vitest";
import { Result, TaggedError } from "./index";

class ReadError extends TaggedError("ReadError")<{}> {}
class ComputeError extends TaggedError("ComputeError")<{}> {}

describe("Result.gen receiver", () => {
  it("infers the receiver, success value and yielded/returned error union", () => {
    const receiver = {
      multiplier: 2,
      read: (): Result<number, ReadError> => Result.ok(5),
    };

    const result = Result.gen(receiver, function* () {
      expectTypeOf(this).toEqualTypeOf<typeof receiver>();
      const value = yield* this.read();
      if (value < 0) return Result.err(new ComputeError());
      return Result.ok(value * this.multiplier);
    });

    expectTypeOf(result).toEqualTypeOf<Result<number, ReadError | ComputeError>>();
  });

  it("infers an async generator's receiver, Promise and error union", () => {
    const receiver = {
      multiplier: 2,
      read: (): Promise<Result<number, ReadError>> => Promise.resolve(Result.ok(5)),
    };

    const result = Result.gen(receiver, async function* () {
      expectTypeOf(this).toEqualTypeOf<typeof receiver>();
      const value = yield* Result.await(this.read());
      if (value < 0) return Result.err(new ComputeError());
      return Result.ok(value * this.multiplier);
    });

    expectTypeOf(result).toEqualTypeOf<Promise<Result<number, ReadError | ComputeError>>>();
  });

  it("preserves inference for the single-argument overloads", () => {
    const read = (): Result<number, ReadError> => Result.ok(5);
    const sync = Result.gen(function* () {
      return Result.ok(yield* read());
    });
    const async = Result.gen(async function* () {
      return Result.ok(yield* Result.await(Promise.resolve(read())));
    });

    expectTypeOf(sync).toEqualTypeOf<Result<number, ReadError>>();
    expectTypeOf(async).toEqualTypeOf<Promise<Result<number, ReadError>>>();
  });

  it("rejects a receiver incompatible with an explicitly typed body", () => {
    function* body(this: { value: number }) {
      return Result.ok(yield* Result.ok(this.value));
    }
    async function* asyncBody(this: { value: number }) {
      return Result.ok(yield* Result.await(Promise.resolve(Result.ok(this.value))));
    }

    // @ts-expect-error - the body requires a numeric value on its receiver
    Result.gen({ value: "invalid" }, body);
    // @ts-expect-error - the async body requires a numeric value on its receiver
    Result.gen({ value: "invalid" }, asyncBody);
    // @ts-expect-error - the receiver must precede the generator body
    Result.gen(body, { value: 1 });
  });
});
