import { RecordModel } from "pocketbase";

export interface Question extends RecordModel {
  number: string;
  question: string;
  correct_answer: string;
  incorrect_answer_1: string;
  incorrect_answer_2: string;
  incorrect_answer_3: string;
}
