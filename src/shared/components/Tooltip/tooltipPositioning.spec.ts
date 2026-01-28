import {
  calculateAvailableSpace,
  resolveOptimalPosition,
  calculateTooltipCoordinates,
  clampTooltipToContainer,
  type TooltipPosition,
  type AvailableSpace,
  type PositionConfig,
} from "./tooltipPositioning";

describe("tooltipPositioning", () => {
  describe("calculateAvailableSpace", () => {
    it("должен правильно рассчитывать доступное пространство во всех направлениях", () => {
      const targetRect = {
        top: 200,
        left: 300,
        right: 310,
        bottom: 210,
        width: 10,
        height: 10,
      } as DOMRect;

      const containerRect = {
        top: 100,
        left: 100,
        right: 600,
        bottom: 400,
        width: 500,
        height: 300,
      } as DOMRect;

      const tooltipRect = {
        width: 120,
        height: 60,
      } as DOMRect;

      const space = calculateAvailableSpace(
        targetRect,
        containerRect,
        tooltipRect
      );

      // Сверху: 200 - 100 = 100, минус высота тултипа 60, минус отступ 8 = 32
      expect(space.top).toBe(32);
      // Снизу: 400 - 210 = 190, минус высота тултипа 60, минус отступ 8 = 122
      expect(space.bottom).toBe(122);
      // Слева: 300 - 100 = 200, минус ширина тултипа 120, минус отступ 8 = 72
      expect(space.left).toBe(72);
      // Справа: 600 - 310 = 290, минус ширина тултипа 120, минус отступ 8 = 162
      expect(space.right).toBe(162);
    });

    it("должен возвращать отрицательные значения, когда места недостаточно", () => {
      const targetRect = {
        top: 110,
        left: 110,
        right: 120,
        bottom: 120,
        width: 10,
        height: 10,
      } as DOMRect;

      const containerRect = {
        top: 100,
        left: 100,
        right: 250,
        bottom: 200,
        width: 150,
        height: 100,
      } as DOMRect;

      const tooltipRect = {
        width: 120,
        height: 60,
      } as DOMRect;

      const space = calculateAvailableSpace(
        targetRect,
        containerRect,
        tooltipRect
      );

      // Сверху недостаточно места: 110 - 100 = 10, минус 60 + 8 = -58
      expect(space.top).toBeLessThan(0);
      // Слева недостаточно места: 110 - 100 = 10, минус 120 + 8 = -118
      expect(space.left).toBeLessThan(0);
    });
  });

  describe("resolveOptimalPosition", () => {
    it("должен выбирать 'top', когда сверху больше места чем снизу", () => {
      const space: AvailableSpace = {
        top: 100,
        bottom: 50,
        left: 50,
        right: 50,
      };

      const position = resolveOptimalPosition(space);
      expect(position).toBe("top");
    });

    it("должен выбирать 'bottom', когда сверху недостаточно места, но снизу есть", () => {
      const space: AvailableSpace = {
        top: -10,
        bottom: 100,
        left: 50,
        right: 50,
      };

      const position = resolveOptimalPosition(space);
      expect(position).toBe("bottom");
    });

    it("должен выбирать 'left', когда вертикально нет места, но слева есть", () => {
      const space: AvailableSpace = {
        top: -10,
        bottom: -10,
        left: 50,
        right: 30,
      };

      const position = resolveOptimalPosition(space);
      expect(position).toBe("left");
    });

    it("должен выбирать 'right', когда только справа есть место", () => {
      const space: AvailableSpace = {
        top: -10,
        bottom: -10,
        left: -10,
        right: 50,
      };

      const position = resolveOptimalPosition(space);
      expect(position).toBe("right");
    });

    it("должен предпочитать вертикальное позиционирование горизонтальному", () => {
      const space: AvailableSpace = {
        top: 50,
        bottom: 100,
        left: 150,
        right: 200,
      };

      // Даже если горизонтально больше места, выбираем вертикальное (в данном случае bottom, так как там больше места)
      const position = resolveOptimalPosition(space);
      expect(["top", "bottom"]).toContain(position);
      expect(position).not.toBe("left");
      expect(position).not.toBe("right");
    });

    it("должен выбирать сторону с большим пространством среди вертикальных", () => {
      const space: AvailableSpace = {
        top: 30,
        bottom: 100,
        left: -10,
        right: -10,
      };

      // bottom имеет больше места чем top
      const position = resolveOptimalPosition(space);
      expect(position).toBe("bottom");
    });

    it("должен выбирать сторону с большим пространством среди горизонтальных", () => {
      const space: AvailableSpace = {
        top: -10,
        bottom: -10,
        left: 30,
        right: 100,
      };

      // right имеет больше места чем left
      const position = resolveOptimalPosition(space);
      expect(position).toBe("right");
    });

    it("должен возвращать 'top' когда вообще нет места (fallback)", () => {
      const space: AvailableSpace = {
        top: -50,
        bottom: -50,
        left: -50,
        right: -50,
      };

      const position = resolveOptimalPosition(space);
      expect(position).toBe("top");
    });
  });

  describe("calculateTooltipCoordinates", () => {
    const targetRect = {
      top: 200,
      left: 300,
      right: 310,
      bottom: 210,
      width: 10,
      height: 10,
    } as DOMRect;

    const tooltipRect = {
      width: 120,
      height: 60,
    } as DOMRect;

    it("должен рассчитывать координаты для позиции 'top'", () => {
      const config: PositionConfig = {
        targetRect,
        tooltipRect,
        position: "top",
        offset: 8,
      };

      const coords = calculateTooltipCoordinates(config);

      // x: центр элемента минус половина ширины тултипа
      // 300 + 10/2 - 120/2 = 305 - 60 = 245
      expect(coords.x).toBe(245);
      // y: верх элемента минус высота тултипа минус отступ
      // 200 - 60 - 8 = 132
      expect(coords.y).toBe(132);
    });

    it("должен рассчитывать координаты для позиции 'bottom'", () => {
      const config: PositionConfig = {
        targetRect,
        tooltipRect,
        position: "bottom",
        offset: 8,
      };

      const coords = calculateTooltipCoordinates(config);

      // x: центр элемента минус половина ширины тултипа
      expect(coords.x).toBe(245);
      // y: низ элемента плюс отступ
      // 210 + 8 = 218
      expect(coords.y).toBe(218);
    });

    it("должен рассчитывать координаты для позиции 'left'", () => {
      const config: PositionConfig = {
        targetRect,
        tooltipRect,
        position: "left",
        offset: 8,
      };

      const coords = calculateTooltipCoordinates(config);

      // x: левая сторона элемента минус ширина тултипа минус отступ
      // 300 - 120 - 8 = 172
      expect(coords.x).toBe(172);
      // y: центр элемента минус половина высоты тултипа
      // 200 + 10/2 - 60/2 = 205 - 30 = 175
      expect(coords.y).toBe(175);
    });

    it("должен рассчитывать координаты для позиции 'right'", () => {
      const config: PositionConfig = {
        targetRect,
        tooltipRect,
        position: "right",
        offset: 8,
      };

      const coords = calculateTooltipCoordinates(config);

      // x: правая сторона элемента плюс отступ
      // 310 + 8 = 318
      expect(coords.x).toBe(318);
      // y: центр элемента минус половина высоты тултипа
      expect(coords.y).toBe(175);
    });

    it("должен использовать кастомный offset", () => {
      const config: PositionConfig = {
        targetRect,
        tooltipRect,
        position: "top",
        offset: 16,
      };

      const coords = calculateTooltipCoordinates(config);

      // y с offset 16: 200 - 60 - 16 = 124
      expect(coords.y).toBe(124);
    });
  });

  describe("clampTooltipToContainer", () => {
    const tooltipRect = {
      width: 120,
      height: 60,
    } as DOMRect;

    const containerRect = {
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
    } as DOMRect;

    it("не должен изменять координаты, если тултип полностью помещается в контейнер", () => {
      const coords = { x: 300, y: 200 };

      const clampedCoords = clampTooltipToContainer(
        coords,
        tooltipRect,
        containerRect
      );

      expect(clampedCoords.x).toBe(300);
      expect(clampedCoords.y).toBe(200);
    });

    it("должен корректировать x, если тултип выходит за левый край контейнера", () => {
      const coords = { x: -10, y: 200 };

      const clampedCoords = clampTooltipToContainer(
        coords,
        tooltipRect,
        containerRect
      );

      // Должен быть прижат к левому краю (0)
      expect(clampedCoords.x).toBe(0);
      expect(clampedCoords.y).toBe(200);
    });

    it("должен корректировать x, если тултип выходит за правый край контейнера", () => {
      const coords = { x: 750, y: 200 };
      // x = 750, ширина тултипа = 120, то есть правый край будет 870, что больше 800

      const clampedCoords = clampTooltipToContainer(
        coords,
        tooltipRect,
        containerRect
      );

      // Должен быть прижат к правому краю: 800 - 120 = 680
      expect(clampedCoords.x).toBe(680);
      expect(clampedCoords.y).toBe(200);
    });

    it("должен корректировать y, если тултип выходит за верхний край контейнера", () => {
      const coords = { x: 300, y: -20 };

      const clampedCoords = clampTooltipToContainer(
        coords,
        tooltipRect,
        containerRect
      );

      expect(clampedCoords.x).toBe(300);
      // Должен быть прижат к верхнему краю (0)
      expect(clampedCoords.y).toBe(0);
    });

    it("должен корректировать y, если тултип выходит за нижний край контейнера", () => {
      const coords = { x: 300, y: 580 };
      // y = 580, высота тултипа = 60, то есть нижний край будет 640, что больше 600

      const clampedCoords = clampTooltipToContainer(
        coords,
        tooltipRect,
        containerRect
      );

      expect(clampedCoords.x).toBe(300);
      // Должен быть прижат к нижнему краю: 600 - 60 = 540
      expect(clampedCoords.y).toBe(540);
    });

    it("должен корректировать и x, и y одновременно, если тултип выходит за несколько краев", () => {
      const coords = { x: -50, y: -30 };

      const clampedCoords = clampTooltipToContainer(
        coords,
        tooltipRect,
        containerRect
      );

      expect(clampedCoords.x).toBe(0);
      expect(clampedCoords.y).toBe(0);
    });

    it("должен корректировать координаты для тултипа в правом нижнем углу", () => {
      const coords = { x: 720, y: 560 };
      // x = 720 + 120 = 840 > 800 (выходит за правый край)
      // y = 560 + 60 = 620 > 600 (выходит за нижний край)

      const clampedCoords = clampTooltipToContainer(
        coords,
        tooltipRect,
        containerRect
      );

      expect(clampedCoords.x).toBe(680); // 800 - 120
      expect(clampedCoords.y).toBe(540); // 600 - 60
    });

    it("должен работать с контейнером, у которого начальные координаты не (0, 0)", () => {
      const containerWithOffset = {
        top: 100,
        left: 50,
        right: 850,
        bottom: 700,
        width: 800,
        height: 600,
      } as DOMRect;

      const coords = { x: 30, y: 80 };
      // x = 30 < left (50), должно быть скорректировано до 50
      // y = 80 < top (100), должно быть скорректировано до 100

      const clampedCoords = clampTooltipToContainer(
        coords,
        tooltipRect,
        containerWithOffset
      );

      expect(clampedCoords.x).toBe(50);
      expect(clampedCoords.y).toBe(100);
    });
  });
});
