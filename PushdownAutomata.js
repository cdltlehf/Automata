class PDA {
  constructor(states, input, stack, transition, startState, acceptingState) {
    this.states = JSON.parse(JSON.stringify(states));
    this.input = JSON.parse(JSON.stringify(input));
    this.stack = JSON.parse(JSON.stringify(stack));
    this.transition = JSON.parse(JSON.stringify(transition));
    this.startState = JSON.parse(JSON.stringify(startState));
    this.acceptingState = JSON.parse(JSON.stringify(acceptingState));
  }

  computate(state, input, log = false) {
    for(let i in input) {
      const a = input[i];
      const result = this.transition[state][a];
      if (log) console.log(`(${state},${a}) -> ${result}`); 
      state = result;
    }
    return state;
  }

  isAccept(input, log = false) { 
    if (log) console.log(input);
    return this.finalStates.includes(this.computate(this.startState, input, log));
  }
}
