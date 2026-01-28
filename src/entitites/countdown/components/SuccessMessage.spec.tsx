import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { SuccessMessage } from "./SuccessMessage";

describe("SuccessMessage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should render message with checkmark", () => {
    render(<SuccessMessage message="Время сохранено!" />);

    expect(screen.getByTestId("success-message")).toBeInTheDocument();
    expect(screen.getByText(/Время сохранено!/)).toBeInTheDocument();
  });

  it("should call onComplete after duration", async () => {
    const onComplete = jest.fn();

    render(
      <SuccessMessage
        message="Время сохранено!"
        duration={2000}
        onComplete={onComplete}
      />
    );

    expect(onComplete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it("should have data-testid='success-message'", () => {
    render(<SuccessMessage message="Test" />);

    const element = screen.getByTestId("success-message");
    expect(element).toBeInTheDocument();
  });

  it("should use default duration of 2000ms", async () => {
    const onComplete = jest.fn();

    render(<SuccessMessage message="Test" onComplete={onComplete} />);

    jest.advanceTimersByTime(1999);
    expect(onComplete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it("should cleanup timer on unmount", () => {
    const onComplete = jest.fn();

    const { unmount } = render(
      <SuccessMessage message="Test" onComplete={onComplete} />
    );

    unmount();

    jest.advanceTimersByTime(2000);

    expect(onComplete).not.toHaveBeenCalled();
  });

  describe("onHideWindow callback", () => {
    it("should call onHideWindow before onComplete when hideWindowDelay is specified", async () => {
      const onComplete = jest.fn();
      const onHideWindow = jest.fn();

      render(
        <SuccessMessage
          message="Test"
          duration={2000}
          hideWindowDelay={1500}
          onComplete={onComplete}
          onHideWindow={onHideWindow}
        />
      );

      // До hideWindowDelay - ничего не вызвано
      jest.advanceTimersByTime(1499);
      expect(onHideWindow).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();

      // После hideWindowDelay - вызван onHideWindow, но не onComplete
      jest.advanceTimersByTime(1);
      await waitFor(() => {
        expect(onHideWindow).toHaveBeenCalledTimes(1);
      });
      expect(onComplete).not.toHaveBeenCalled();

      // После duration - вызван onComplete
      jest.advanceTimersByTime(500);
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      });
    });

    it("should not call onHideWindow if hideWindowDelay is not specified", async () => {
      const onComplete = jest.fn();
      const onHideWindow = jest.fn();

      render(
        <SuccessMessage
          message="Test"
          duration={2000}
          onComplete={onComplete}
          onHideWindow={onHideWindow}
        />
      );

      jest.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      });
      // onHideWindow не должен быть вызван без hideWindowDelay
      expect(onHideWindow).not.toHaveBeenCalled();
    });

    it("should cleanup both timers on unmount", () => {
      const onComplete = jest.fn();
      const onHideWindow = jest.fn();

      const { unmount } = render(
        <SuccessMessage
          message="Test"
          duration={2000}
          hideWindowDelay={1500}
          onComplete={onComplete}
          onHideWindow={onHideWindow}
        />
      );

      unmount();

      jest.advanceTimersByTime(2000);

      expect(onHideWindow).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});
