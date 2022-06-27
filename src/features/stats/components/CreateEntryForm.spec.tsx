import React from "react";
import { cleanup, render, fireEvent } from "@testing-library/react";
import { CreateEntryForm } from "./CreateEntryForm";
import userEvent from "@testing-library/user-event";
import {
  IntervalType,
  IntervalTypes,
} from "../../../entitites/countdown/constants";
import { doubleDigit } from "../../../shared/utils";
import { StatEntry } from "../typings";

const submitForm = (
  start: string,
  time: string,
  type: string,
  onSubmit: (entry: StatEntry) => void
) => {
  const { getByTestId } = render(<CreateEntryForm onSubmit={onSubmit} />);

  fireEvent.change(getByTestId("startInput"), {
    target: { value: start },
  });
  userEvent.type(getByTestId("timeInput"), time);
  if (IntervalTypes.includes(type)) {
    userEvent.selectOptions(getByTestId("typeSelect"), type);
  }
  userEvent.click(getByTestId("submit"));
};

const getDatetimeLocal = (hours = 0, minutes = 0) => {
  const todayAtTen = new Date(new Date().setHours(hours, minutes, 0, 0));
  return `${todayAtTen.getFullYear()}-${doubleDigit(
    todayAtTen.getMonth() + 1
  )}-${todayAtTen.getDate()}T${todayAtTen.getHours()}:${todayAtTen.getMinutes()}`;
};

describe("CreateEntryForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("должен вызвать onSubmit, если все заполнено правильно", () => {
    const handleSubmitSpy = jest.fn();
    const datetimeLocal = getDatetimeLocal(10, 10);
    const startDate = new Date(datetimeLocal);
    const seconds = 10;
    const type = IntervalType.WORK;

    submitForm(datetimeLocal, `00:00:${seconds}`, type, handleSubmitSpy);

    expect(handleSubmitSpy).toBeCalledWith({
      start: startDate.getTime(),
      end: startDate.getTime() + seconds * 1000,
      interval: seconds,
      time: seconds,
      type,
    });
  });

  it("должен вызвать onSubmit c типом REST", () => {
    const handleSubmitSpy = jest.fn();
    const datetimeLocal = getDatetimeLocal(10, 10);
    const startDate = new Date(datetimeLocal);
    const seconds = 10;
    const type = IntervalType.REST;

    submitForm(datetimeLocal, `00:00:${seconds}`, type, handleSubmitSpy);

    expect(handleSubmitSpy).toBeCalledWith({
      start: startDate.getTime(),
      end: startDate.getTime() + seconds * 1000,
      interval: seconds,
      time: seconds,
      type,
    });
  });

  it("должен не вызвать onSubmit, если не правильно заполнена дата", () => {
    const handleSubmitSpy = jest.fn();
    const seconds = 10;
    const type = IntervalType.WORK;

    submitForm("wrong", `00:00:${seconds}`, type, handleSubmitSpy);

    expect(handleSubmitSpy).not.toBeCalled();
  });

  it("должен не вызвать onSubmit, если не правильно заполнена продолжительность", () => {
    const handleSubmitSpy = jest.fn();
    const datetimeLocal = getDatetimeLocal(10, 10);
    const type = IntervalType.WORK;

    submitForm(datetimeLocal, "wrong", type, handleSubmitSpy);

    expect(handleSubmitSpy).not.toBeCalled();
  });

  it("должен вызвать onSubmit, если не правильно заполнен тип", () => {
    const handleSubmitSpy = jest.fn();
    const datetimeLocal = getDatetimeLocal(10, 10);
    const seconds = 10;

    submitForm(datetimeLocal, `00:00:${seconds}`, "wrong", handleSubmitSpy);

    expect(handleSubmitSpy).toBeCalled();
  });
});
