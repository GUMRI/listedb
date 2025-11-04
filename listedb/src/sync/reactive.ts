export function createReactive<T>(initialValue: T) {
  let value = initialValue;
  const subscribers = new Set<(value: T) => void>();

  const reactive = (newValue?: T) => {
    if (newValue !== undefined) {
      value = newValue;
      subscribers.forEach(subscriber => subscriber(value));
    }
    return value;
  };

  reactive.subscribe = (callback: (value: T) => void) => {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  };

  return reactive;
}
