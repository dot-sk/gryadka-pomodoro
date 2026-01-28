import React from "react";
import { render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    // Мокаем getBoundingClientRect по умолчанию
    Element.prototype.getBoundingClientRect = jest.fn(function (this: Element) {
      // Контейнер
      if (this.getAttribute("data-testid") === "test-container") {
        return {
          top: 100,
          left: 100,
          right: 600,
          bottom: 400,
          width: 500,
          height: 300,
          x: 100,
          y: 100,
          toJSON: () => {},
        } as DOMRect;
      }
      // Целевой элемент (Tooltip.Target создает div)
      if (this.hasAttribute("data-testid") === false && this.tagName === "DIV") {
        // Проверяем, является ли это target элементом по содержимому
        if (this.textContent === "Target Element") {
          return {
            top: 200,
            left: 300,
            right: 310,
            bottom: 210,
            width: 10,
            height: 10,
            x: 300,
            y: 200,
            toJSON: () => {},
          } as DOMRect;
        }
      }
      // Тултип
      if (this.getAttribute("data-testid") === "tooltip") {
        return {
          top: 0,
          left: 0,
          right: 120,
          bottom: 60,
          width: 120,
          height: 60,
          x: 0,
          y: 0,
          toJSON: () => {},
        } as DOMRect;
      }
      return {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      } as DOMRect;
    });
  });

  it("должен рендерить тултип с содержимым при наведении", () => {
    const { getByText, queryByTestId } = render(
      <Tooltip>
        <Tooltip.Target>
          <div>Target Element</div>
        </Tooltip.Target>
        <Tooltip.Content>
          <div>Tooltip Content</div>
        </Tooltip.Content>
      </Tooltip>
    );

    // Тултип не виден до наведения
    expect(queryByTestId("tooltip")).not.toBeInTheDocument();

    // Наводим на target
    const target = getByText("Target Element").parentElement;
    if (target) {
      fireEvent.mouseEnter(target);

      // Тултип появился
      const tooltip = queryByTestId("tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(getByText("Tooltip Content")).toBeInTheDocument();

      // Убираем курсор
      fireEvent.mouseLeave(target);

      // Тултип исчез
      expect(queryByTestId("tooltip")).not.toBeInTheDocument();
    }
  });

  it("должен добавлять data-position атрибут", () => {
    const { getByText, queryByTestId } = render(
      <Tooltip>
        <Tooltip.Target>
          <div>Target</div>
        </Tooltip.Target>
        <Tooltip.Content>
          <div>Content</div>
        </Tooltip.Content>
      </Tooltip>
    );

    const target = getByText("Target").parentElement;
    if (target) {
      fireEvent.mouseEnter(target);

      const tooltip = queryByTestId("tooltip");
      expect(tooltip).toHaveAttribute("data-position");
    }
  });

  it("должен позиционироваться сверху, когда сверху больше места", async () => {
    const containerRef = React.createRef<HTMLDivElement>();

    // Настраиваем getBoundingClientRect так, чтобы сверху было больше места
    Element.prototype.getBoundingClientRect = jest.fn(function (this: Element) {
      if (this.getAttribute("data-testid") === "test-container") {
        return {
          top: 0,
          left: 0,
          right: 500,
          bottom: 500,
          width: 500,
          height: 500,
          x: 0,
          y: 0,
          toJSON: () => {},
        } as DOMRect;
      }
      if (this.textContent === "Target") {
        // Элемент внизу контейнера, чтобы сверху было НАМНОГО больше места
        return {
          top: 400,
          left: 250,
          right: 260,
          bottom: 410,
          width: 10,
          height: 10,
          x: 250,
          y: 400,
          toJSON: () => {},
        } as DOMRect;
      }
      if (this.getAttribute("data-testid") === "tooltip") {
        return {
          top: 0,
          left: 0,
          right: 100,
          bottom: 50,
          width: 100,
          height: 50,
          x: 0,
          y: 0,
          toJSON: () => {},
        } as DOMRect;
      }
      return {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      } as DOMRect;
    });

    const { getByText, queryByTestId } = render(
      <div ref={containerRef} data-testid="test-container">
        <Tooltip containerRef={containerRef}>
          <Tooltip.Target>
            <div>Target</div>
          </Tooltip.Target>
          <Tooltip.Content>
            <div>Content</div>
          </Tooltip.Content>
        </Tooltip>
      </div>
    );

    const target = getByText("Target").parentElement;
    if (target) {
      fireEvent.mouseEnter(target);

      await waitFor(() => {
        const tooltip = queryByTestId("tooltip");
        expect(tooltip?.getAttribute("data-position")).toBe("top");
      });
    }
  });

  it("должен позиционироваться снизу, когда сверху недостаточно места", () => {
    // Переопределяем getBoundingClientRect для теста
    Element.prototype.getBoundingClientRect = jest.fn(function (this: Element) {
      if (this.getAttribute("data-testid") === "test-container") {
        return {
          top: 100,
          left: 100,
          right: 600,
          bottom: 400,
          width: 500,
          height: 300,
          x: 100,
          y: 100,
          toJSON: () => {},
        } as DOMRect;
      }
      if (this.textContent === "Target") {
        // Элемент близко к верху контейнера
        return {
          top: 110,
          left: 300,
          right: 310,
          bottom: 120,
          width: 10,
          height: 10,
          x: 300,
          y: 110,
          toJSON: () => {},
        } as DOMRect;
      }
      if (this.getAttribute("data-testid") === "tooltip") {
        return {
          top: 0,
          left: 0,
          right: 120,
          bottom: 60,
          width: 120,
          height: 60,
          x: 0,
          y: 0,
          toJSON: () => {},
        } as DOMRect;
      }
      return {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      } as DOMRect;
    });

    const containerRef = React.createRef<HTMLDivElement>();
    const { getByText, queryByTestId } = render(
      <div ref={containerRef} data-testid="test-container">
        <Tooltip containerRef={containerRef}>
          <Tooltip.Target>
            <div>Target</div>
          </Tooltip.Target>
          <Tooltip.Content>
            <div>Content</div>
          </Tooltip.Content>
        </Tooltip>
      </div>
    );

    const target = getByText("Target").parentElement;
    if (target) {
      fireEvent.mouseEnter(target);

      const tooltip = queryByTestId("tooltip");
      expect(tooltip?.getAttribute("data-position")).toBe("bottom");
    }
  });

  it("должен применять кастомный offset", () => {
    const { getByText, queryByTestId } = render(
      <Tooltip offset={16}>
        <Tooltip.Target>
          <div>Target</div>
        </Tooltip.Target>
        <Tooltip.Content>
          <div>Content</div>
        </Tooltip.Content>
      </Tooltip>
    );

    const target = getByText("Target").parentElement;
    if (target) {
      fireEvent.mouseEnter(target);

      const tooltip = queryByTestId("tooltip");
      expect(tooltip).toBeInTheDocument();
    }
  });

  it("должен применять кастомный className к Target", () => {
    const { getByText } = render(
      <Tooltip>
        <Tooltip.Target className="custom-target-class">
          <div>Target</div>
        </Tooltip.Target>
        <Tooltip.Content>
          <div>Content</div>
        </Tooltip.Content>
      </Tooltip>
    );

    const target = getByText("Target").parentElement;
    expect(target).toHaveClass("custom-target-class");
  });

  it("должен применять кастомный className к Content", () => {
    const { getByText, queryByTestId } = render(
      <Tooltip>
        <Tooltip.Target>
          <div>Target</div>
        </Tooltip.Target>
        <Tooltip.Content className="custom-content-class">
          <div>Content</div>
        </Tooltip.Content>
      </Tooltip>
    );

    const target = getByText("Target").parentElement;
    if (target) {
      fireEvent.mouseEnter(target);

      const tooltip = queryByTestId("tooltip");
      expect(tooltip).toHaveClass("custom-content-class");
    }
  });

  it("должен работать без containerRef (использовать viewport)", () => {
    const { getByText, queryByTestId } = render(
      <Tooltip>
        <Tooltip.Target>
          <div>Target</div>
        </Tooltip.Target>
        <Tooltip.Content>
          <div>Content</div>
        </Tooltip.Content>
      </Tooltip>
    );

    const target = getByText("Target").parentElement;
    if (target) {
      fireEvent.mouseEnter(target);

      const tooltip = queryByTestId("tooltip");
      expect(tooltip).toBeInTheDocument();
    }
  });

  it("должен иметь pointer-events: none", () => {
    const { getByText, queryByTestId } = render(
      <Tooltip>
        <Tooltip.Target>
          <div>Target</div>
        </Tooltip.Target>
        <Tooltip.Content>
          <div>Content</div>
        </Tooltip.Content>
      </Tooltip>
    );

    const target = getByText("Target").parentElement;
    if (target) {
      fireEvent.mouseEnter(target);

      const tooltip = queryByTestId("tooltip");
      expect(tooltip?.className).toContain("pointer-events-none");
    }
  });

  it("должен бросать ошибку при использовании Target вне Tooltip", () => {
    // Подавляем console.error для этого теста
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      render(
        <Tooltip.Target>
          <div>Target</div>
        </Tooltip.Target>
      );
    }).toThrow(
      "Tooltip compound components must be used within a Tooltip component"
    );

    consoleError.mockRestore();
  });

  it("должен бросать ошибку при использовании Content вне Tooltip", () => {
    // Подавляем console.error для этого теста
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      render(
        <Tooltip.Content>
          <div>Content</div>
        </Tooltip.Content>
      );
    }).toThrow(
      "Tooltip compound components must be used within a Tooltip component"
    );

    consoleError.mockRestore();
  });

  describe("Ограничение тултипа границами контейнера", () => {
    it("должен корректировать позицию тултипа, чтобы он не выходил за правый край контейнера", async () => {
      // Элемент у правого края контейнера
      Element.prototype.getBoundingClientRect = jest.fn(function (this: Element) {
        if (this.getAttribute("data-testid") === "test-container") {
          return {
            top: 0,
            left: 0,
            right: 500,
            bottom: 500,
            width: 500,
            height: 500,
            x: 0,
            y: 0,
            toJSON: () => {},
          } as DOMRect;
        }
        if (this.textContent === "Target") {
          // Элемент у правого края (x: 490)
          return {
            top: 250,
            left: 490,
            right: 495,
            bottom: 260,
            width: 5,
            height: 10,
            x: 490,
            y: 250,
            toJSON: () => {},
          } as DOMRect;
        }
        if (this.getAttribute("data-testid") === "tooltip") {
          // Широкий тултип (120px)
          return {
            top: 0,
            left: 0,
            right: 120,
            bottom: 60,
            width: 120,
            height: 60,
            x: 0,
            y: 0,
            toJSON: () => {},
          } as DOMRect;
        }
        return {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => {},
        } as DOMRect;
      });

      const containerRef = React.createRef<HTMLDivElement>();
      const { getByText, queryByTestId } = render(
        <div ref={containerRef} data-testid="test-container">
          <Tooltip containerRef={containerRef}>
            <Tooltip.Target>
              <div>Target</div>
            </Tooltip.Target>
            <Tooltip.Content>
              <div>Content</div>
            </Tooltip.Content>
          </Tooltip>
        </div>
      );

      const target = getByText("Target").parentElement;
      if (target) {
        fireEvent.mouseEnter(target);

        await waitFor(() => {
          const tooltip = queryByTestId("tooltip");
          expect(tooltip).toBeInTheDocument();

          if (tooltip) {
            const left = parseFloat(tooltip.style.left);
            const tooltipWidth = 120;
            // Тултип не должен выходить за правый край (500px)
            expect(left + tooltipWidth).toBeLessThanOrEqual(500);
          }
        });
      }
    });

    it("должен корректировать позицию тултипа, чтобы он не выходил за левый край контейнера", async () => {
      Element.prototype.getBoundingClientRect = jest.fn(function (this: Element) {
        if (this.getAttribute("data-testid") === "test-container") {
          return {
            top: 0,
            left: 100,
            right: 600,
            bottom: 500,
            width: 500,
            height: 500,
            x: 100,
            y: 0,
            toJSON: () => {},
          } as DOMRect;
        }
        if (this.textContent === "Target") {
          // Элемент у левого края контейнера (x: 105)
          return {
            top: 250,
            left: 105,
            right: 110,
            bottom: 260,
            width: 5,
            height: 10,
            x: 105,
            y: 250,
            toJSON: () => {},
          } as DOMRect;
        }
        if (this.getAttribute("data-testid") === "tooltip") {
          return {
            top: 0,
            left: 0,
            right: 120,
            bottom: 60,
            width: 120,
            height: 60,
            x: 0,
            y: 0,
            toJSON: () => {},
          } as DOMRect;
        }
        return {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => {},
        } as DOMRect;
      });

      const containerRef = React.createRef<HTMLDivElement>();
      const { getByText, queryByTestId } = render(
        <div ref={containerRef} data-testid="test-container">
          <Tooltip containerRef={containerRef}>
            <Tooltip.Target>
              <div>Target</div>
            </Tooltip.Target>
            <Tooltip.Content>
              <div>Content</div>
            </Tooltip.Content>
          </Tooltip>
        </div>
      );

      const target = getByText("Target").parentElement;
      if (target) {
        fireEvent.mouseEnter(target);

        await waitFor(() => {
          const tooltip = queryByTestId("tooltip");
          expect(tooltip).toBeInTheDocument();

          if (tooltip) {
            const left = parseFloat(tooltip.style.left);
            // Тултип не должен выходить за левый край контейнера (100px)
            expect(left).toBeGreaterThanOrEqual(100);
          }
        });
      }
    });

    it("должен корректировать позицию тултипа, чтобы он не выходил за верхний край контейнера", async () => {
      Element.prototype.getBoundingClientRect = jest.fn(function (this: Element) {
        if (this.getAttribute("data-testid") === "test-container") {
          return {
            top: 50,
            left: 0,
            right: 500,
            bottom: 550,
            width: 500,
            height: 500,
            x: 0,
            y: 50,
            toJSON: () => {},
          } as DOMRect;
        }
        if (this.textContent === "Target") {
          // Элемент близко к верхнему краю (y: 60)
          return {
            top: 60,
            left: 250,
            right: 255,
            bottom: 70,
            width: 5,
            height: 10,
            x: 250,
            y: 60,
            toJSON: () => {},
          } as DOMRect;
        }
        if (this.getAttribute("data-testid") === "tooltip") {
          return {
            top: 0,
            left: 0,
            right: 120,
            bottom: 60,
            width: 120,
            height: 60,
            x: 0,
            y: 0,
            toJSON: () => {},
          } as DOMRect;
        }
        return {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => {},
        } as DOMRect;
      });

      const containerRef = React.createRef<HTMLDivElement>();
      const { getByText, queryByTestId } = render(
        <div ref={containerRef} data-testid="test-container">
          <Tooltip containerRef={containerRef}>
            <Tooltip.Target>
              <div>Target</div>
            </Tooltip.Target>
            <Tooltip.Content>
              <div>Content</div>
            </Tooltip.Content>
          </Tooltip>
        </div>
      );

      const target = getByText("Target").parentElement;
      if (target) {
        fireEvent.mouseEnter(target);

        await waitFor(() => {
          const tooltip = queryByTestId("tooltip");
          expect(tooltip).toBeInTheDocument();

          if (tooltip) {
            const top = parseFloat(tooltip.style.top);
            // Тултип не должен выходить за верхний край контейнера (50px)
            expect(top).toBeGreaterThanOrEqual(50);
          }
        });
      }
    });

    it("должен корректировать позицию тултипа, чтобы он не выходил за нижний край контейнера", async () => {
      Element.prototype.getBoundingClientRect = jest.fn(function (this: Element) {
        if (this.getAttribute("data-testid") === "test-container") {
          return {
            top: 0,
            left: 0,
            right: 500,
            bottom: 300,
            width: 500,
            height: 300,
            x: 0,
            y: 0,
            toJSON: () => {},
          } as DOMRect;
        }
        if (this.textContent === "Target") {
          // Элемент близко к нижнему краю (y: 290)
          return {
            top: 290,
            left: 250,
            right: 255,
            bottom: 295,
            width: 5,
            height: 5,
            x: 250,
            y: 290,
            toJSON: () => {},
          } as DOMRect;
        }
        if (this.getAttribute("data-testid") === "tooltip") {
          return {
            top: 0,
            left: 0,
            right: 120,
            bottom: 60,
            width: 120,
            height: 60,
            x: 0,
            y: 0,
            toJSON: () => {},
          } as DOMRect;
        }
        return {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => {},
        } as DOMRect;
      });

      const containerRef = React.createRef<HTMLDivElement>();
      const { getByText, queryByTestId } = render(
        <div ref={containerRef} data-testid="test-container">
          <Tooltip containerRef={containerRef}>
            <Tooltip.Target>
              <div>Target</div>
            </Tooltip.Target>
            <Tooltip.Content>
              <div>Content</div>
            </Tooltip.Content>
          </Tooltip>
        </div>
      );

      const target = getByText("Target").parentElement;
      if (target) {
        fireEvent.mouseEnter(target);

        await waitFor(() => {
          const tooltip = queryByTestId("tooltip");
          expect(tooltip).toBeInTheDocument();

          if (tooltip) {
            const top = parseFloat(tooltip.style.top);
            const tooltipHeight = 60;
            // Тултип не должен выходить за нижний край контейнера (300px)
            expect(top + tooltipHeight).toBeLessThanOrEqual(300);
          }
        });
      }
    });
  });
});
