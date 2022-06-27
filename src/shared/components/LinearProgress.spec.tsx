import React from "react";
import { render, cleanup } from "@testing-library/react";
import { LinearProgress } from "./LinearProgress";

describe("LinearProgress", () => {
  afterEach(() => {
    cleanup();
  });

  it("должен рендерить шкалу шагами при value=0.01 и max=100", () => {
    const { container, getByTestId } = render(
      <LinearProgress value={0.01} max={100} />
    );
    expect(getByTestId("lineProgress").style.transform).toBe(
      "scaleX(0.03333333333333333)"
    );
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="flex rounded-full overflow-hidden w-full"
        data-testid="lineProgressContainer"
        style="background: rgb(234, 234, 234);"
      >
        <div
          class="bg-black w-full h-[4px] origin-left"
          data-testid="lineProgress"
          style="transform: scaleX(0.03333333333333333);"
        />
      </div>
    `);
  });

  it("должен рендерить половину шкалы при value=50 и max=100", () => {
    const { container, getByTestId } = render(
      <LinearProgress value={50} max={100} />
    );
    expect(getByTestId("lineProgress").style.transform).toBe("scaleX(0.5)");
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="flex rounded-full overflow-hidden w-full"
        data-testid="lineProgressContainer"
        style="background: rgb(234, 234, 234);"
      >
        <div
          class="bg-black w-full h-[4px] origin-left"
          data-testid="lineProgress"
          style="transform: scaleX(0.5);"
        />
      </div>
    `);
  });
  it("должен не рендерить шкалу при value=0 и max=100", () => {
    const { container, getByTestId } = render(
      <LinearProgress value={0} max={100} />
    );
    expect(getByTestId("lineProgress").style.transform).toBe("scaleX(0)");
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="flex rounded-full overflow-hidden w-full"
        data-testid="lineProgressContainer"
        style="background: rgb(234, 234, 234);"
      >
        <div
          class="bg-black w-full h-[4px] origin-left"
          data-testid="lineProgress"
          style="transform: scaleX(0);"
        />
      </div>
    `);
  });
  it("должен рендерить полную шкалу при value=100 и max=100", () => {
    const { container, getByTestId } = render(
      <LinearProgress value={100} max={100} />
    );
    expect(getByTestId("lineProgress").style.transform).toBe("scaleX(1)");
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="flex rounded-full overflow-hidden w-full"
        data-testid="lineProgressContainer"
        style="background: rgb(234, 234, 234);"
      >
        <div
          class="bg-black w-full h-[4px] origin-left"
          data-testid="lineProgress"
          style="transform: scaleX(1);"
        />
      </div>
    `);
  });
});
