export class DCError {
  reason: string;
  object: any;

  constructor(reason: string, object: any) {
    this.reason = reason;
    this.object = object;
  }
}

export const token = (): string | null => {
  if (process.env.DEMOCRACY_CLUB_TOKEN) {
    return "auth_token=" + process.env.DEMOCRACY_CLUB_TOKEN;
  } else {
    return null;
  }
};

export let numberOfRequests = 0;

export const addRequestCount = () => {
  numberOfRequests++;
};
