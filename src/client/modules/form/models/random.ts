const textSeed = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

const splitSeed = textSeed.split(' ');

export const random = {
  int(max = 100) {
    return Math.ceil(Math.random() * max);
  },
  float(max = 100) {
    return Math.ceil(Math.random() * (max * 100)) / 100;
  },
  words(count = 2) {
    let result = '';
    for (let i = 0; i < count; i++) {
      result += splitSeed[random.int(splitSeed.length - 1)] + ' ';
    }
    return result;
  },
  boolean() {
    return !!(random.int(1000) % 2);
  }
};