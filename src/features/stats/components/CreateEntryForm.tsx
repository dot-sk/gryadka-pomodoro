import React, { useCallback, useEffect, useState } from "react";
import { StatEntry } from "../typings";
import {
  IntervalType,
  IntervalTypeEmoji,
} from "../../../entitites/countdown/constants";
import { parseSeconds } from "../../../shared/utils";
import { events } from "../model";
import { Button } from "../../../shared/components/Button";

enum FormState {
  INIT,
  LOADING,
  SUCCESS,
  ERROR,
}

const buttonTextMap = {
  [FormState.INIT]: "Сохранить",
  [FormState.LOADING]: "Сохраняется",
  [FormState.SUCCESS]: "Сохранено",
  [FormState.ERROR]: "Что-то пошло не так",
};

type CreateEntryFormPureProps = {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  formState: FormState;
};

const CreateEntryFormPure = ({
  onSubmit,
  formState,
}: CreateEntryFormPureProps) => {
  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col">
        <label>
          <span>Время старта</span>
          <input type="datetime-local" name="start" data-testid="startInput" />
        </label>
        <label>
          <span>Продолжительность</span>
          <input
            type="text"
            name="time"
            placeholder="hh:mm:ss"
            data-testid="timeInput"
          />
        </label>
        <label>
          <span>Тип интервала</span>
          <select name="type" data-testid="typeSelect">
            <option value={IntervalType.WORK}>
              {IntervalTypeEmoji[IntervalType.WORK]}
            </option>
            <option value={IntervalType.REST}>
              {IntervalTypeEmoji[IntervalType.REST]}
            </option>
          </select>
        </label>

        <div className="mt-4">
          <Button
            primary
            type="submit"
            data-testid="submit"
            disabled={formState !== FormState.INIT}
          >
            {buttonTextMap[formState]}
          </Button>
        </div>
      </form>
    </div>
  );
};

type CreateEntryFormProps = {
  onSubmit?: (entry: StatEntry) => void;
};

export const CreateEntryForm = ({ onSubmit }: CreateEntryFormProps) => {
  const [formState, setFormState] = useState<FormState>(FormState.INIT);

  // сбрасываем состояния успеха или ошибки через 5 сек
  useEffect(() => {
    if (formState === FormState.SUCCESS || formState === FormState.ERROR) {
      const timeout = setTimeout(() => {
        setFormState(FormState.INIT);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [formState]);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    setFormState(FormState.LOADING);

    e.preventDefault();
    const currentTarget = e.currentTarget;
    const fd = new FormData(currentTarget);

    const start = new Date(fd.get("start") as string).getTime();
    const time = parseSeconds(fd.get("time") as string);
    const type = fd.get("type") as IntervalType;

    if (start > 0 && time !== null && time > 0) {
      const newEntry: StatEntry = {
        start,
        end: start + time * 1000,
        interval: time,
        type,
        time,
      };

      events.push(newEntry);

      if (typeof onSubmit === "function") {
        onSubmit(newEntry);
      }

      setFormState(FormState.SUCCESS);
      currentTarget.reset();
    }
  }, []);

  return <CreateEntryFormPure onSubmit={handleSubmit} formState={formState} />;
};
