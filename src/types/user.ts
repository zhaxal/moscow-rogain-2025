import { RecordModel } from "pocketbase";

export interface UserAnswer extends RecordModel {
  question_id: string;
  answer: string;
  is_correct: boolean;
  user_id: string;
}
