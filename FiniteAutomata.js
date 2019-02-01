class DFA {
  constructor(states, symbols, transition, startState, finalStates) {
    this.states = JSON.parse(JSON.stringify(states));
    this.symbols = JSON.parse(JSON.stringify(symbols));
    this.transition = JSON.parse(JSON.stringify(transition));
    this.startState = JSON.parse(JSON.stringify(startState));
    this.finalStates = JSON.parse(JSON.stringify(finalStates));
  }

  static fromNFA(nfa) {
    const states = nfa.states.reduce((arr, e)=>{
      return arr.concat(arr.map(f=>[...f, e]));
    }, [[]]).map(e=>`{${e.sort()}}`);
    const symbols = nfa.symbols;
    const transition = nfa.states.reduce((arr, e)=>{
      return arr.concat(arr.map(f=>[...f, e]));
    }, [[]]).reduce((o, states)=>{
      return Object.assign(o, {
        [`{${states.sort()}}`] : symbols.reduce((o, a)=>{
          return Object.assign(o, {[a]:`{${nfa._equivalence([...new Set(states.reduce((arr, state)=>{
            return arr.concat(nfa.transition[state][a]);
          }, []))]).sort()}}`});
        },{})
      });
    },{});
    const startState = `{${nfa._equivalence([nfa.startState]).sort()}}`;
    const finalStates = nfa.states.reduce((arr, e)=>{
      return arr.concat(arr.map(f=>[...f, e]));
    }, [[]]).filter(arr=>arr.some(e=>nfa.finalStates.includes(e))).map(e=>`{${e.sort()}}`);
    return new DFA(states, symbols, transition, startState, finalStates);
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

  toString() {
    let result = "";
    for(let i in this.transition) {
      if (i==this.startState) result += "^";
      result += `${this.finalStates.includes(i)?"!"+i:i}\n`;
      for(let j in this.transition[i]) {
        if (this.transition[i][j].length != 0) {
          if (this.transition[i][j] == "{}") continue;
          result += `| ${j==""?"''":j} -> [${this.transition[i][j]}]\n`;
        }
      }
    }
    return result;
  }

  complement() {
    const states = this.states;
    const symbols = this.symbols;
    const transition = this.transition;
    const startState = this.startState;
    const finalStates = states.filter(s => !this.states.includes(s));
    return new DFA(states, symbols, transition, startState, finalStates);
  }
  
  intersection(dfa) {
    const states = this.states.map(a => dfa.states.map(b => `(${a},${b})`)).reduce((a, b) => a.concat(b), []);
    const symbols = this.symbols;
    const transition = this.states.reduce((o, q1) => {
      return Object.assign(o, dfa.states.reduce((o, q2) => {
        return Object.assign(o, {[`(${q1},${q2})`] : this.symbols.reduce((o, a) => {
          return Object.assign(o, {[a] : `(${this.transition[q1][a]},${dfa.transition[q2][a]})`});
        },{})});
      }, {}));
    },{});
    const startState = `(${this.startState},${dfa.startState})`;
    const finalStates = this.finalStates.reduce((arr, q1) => {
      return arr.concat(dfa.finalStates.map(q2 => `(${q1},${q2})`));
    }, []);
    return new DFA(states, symbols, transition, startState, finalStates);
  }

  union(dfa) {
    const states = this.states.map(a => dfa.states.map(b => `(${a},${b})`)).reduce((a, b) => a.concat(b), []);
    const symbols = this.symbols;
    const transition = this.states.reduce((o, q1) => {
      return Object.assign(o, dfa.states.reduce((o, q2) => {
        return Object.assign(o, {[`(${q1},${q2})`] : this.symbols.reduce((o, a) => {
          return Object.assign(o, {[a] : `(${this.transition[q1][a]},${dfa.transition[q2][a]})`});
        },{})});
      }, {}));
    },{});
    const startState = `(${this.startState},${dfa.startState})`;
    const finalStates = this.states.reduce((arr, q1) => {
      if (this.finalStates.includes(q1)) return arr.concat(dfa.states.map(q2 => `(${q1},${q2})`));
      else return arr.concat(dfa.finalStates.map(q2 => `(${q1},${q2})`));
    }, []);
    return new DFA(states, symbols, transition, startState, finalStates);
  }

  difference(dfa) {
    return this.union(dfa.complement());
  }

  concatenation(dfa) {
    return DFA.fromNFA(NFA.fromDFA(this).concatenation(NFA.fromDFA(dfa)));
  }

  star() {
    return DFA.fromNFA(NFA.fromDFA(this).star());
  }

  testBinary(n, log=false) {
    for (let i=0;i<n;i++) {
      console.log(i.toString(2));
      console.log(nfa3.isAccept(i.toString(2), log));
    }
  }
}

class NFA {
  constructor(states, symbols, transition, startState, finalStates) {
    this.states = JSON.parse(JSON.stringify(states));
    this.symbols = JSON.parse(JSON.stringify(symbols));
    this.transition = JSON.parse(JSON.stringify(transition));
    this.startState = JSON.parse(JSON.stringify(startState));
    this.finalStates = JSON.parse(JSON.stringify(finalStates));
  }

  static get Alphanumeric() { return "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split(''); }
  static get Binary() { return ['0', '1']; }

  static fromDFA(dfa) {
    const states = dfa.states;
    const symbols = dfa.symbols;
    const transition = {};
    for (let i in dfa.transition) {
      transition[i] = {};
      for (let j in dfa.transition[i]) {
        transition[i][j] = [dfa.transition[i][j]];
      }
      transition[i][""] = [];
    }
    const startState = dfa.startState;
    const finalStates = dfa.finalStates;
    return new NFA(states, symbols, transition, startState, finalStates);
  }

  static getEmpty(alphabet=NFA.Alphanumeric) {
    const states = ['empty', 'emptyEnd'];
    const symbols = alphabet;
    const transition = {};
    transition.empty = {};
    transition.emptyEnd = {};
    for (let i in symbols) {
      transition.empty[symbols[i]] = ['emptyEnd'];
      transition.emptyEnd[symbols[i]] = [];
    }
    transition.empty[''] = [];
    transition.emptyEnd[''] = [];
    const startState = 'empty';
    const finalStates = ['empty'];
    return new NFA(states, symbols, transition, startState, finalStates);
  }

  static get(c, alphabet=NFA.Alphanumeric) {
    if (c=="") return getEmpty(alphabet);
    const states = [c, c+'End'];
    const symbols = alphabet;
    const transition = {};
    transition[c] = {};
    transition[c+'End'] = {};
    for (let i in symbols) {
      transition[c][symbols[i]] = (symbols[i]==c)?[c+'End']:[];
      transition[c+'End'][symbols[i]] = [];
    }
    transition[c][''] = [];
    transition[c+'End'][''] = [];
    const startState = c;
    const finalStates = [c+'End'];
    return new NFA(states, symbols, transition, startState, finalStates);
  }

  static parseExp(str, alphabet=NFA.Alphanumeric) {
    let result;
    for (let i = str.length-1;i>=0;i--) {
      if(alphabet.includes(str[i])) {
        if (result) result = NFA.get(str[i]).concatenation(result);
        else result = NFA.get(str[i]);
      }
      else if(str[i] == ')') {
        let j = str.indexOf('(');
        if (result) result = NFA.parseExp(str.slice(j+1, i), alphabet).concatenation(result);
        else result = NFA.get(str[i]);
        i = j;
      }
      else if(str[i] == '|') {
        result = NFA.parseExp(str.slice(0, i), alphabet).union(result);
        i = 0;
      }
      else if(str[i] == '*') {
        if(alphabet.includes(str[i])) {
          if (result) result = NFA.get(str[i]).star().concatenation(result);
          else result = NFA.get(str[i]).star();
        }
        else if (str[i-1] == ')') {
          let j = str.indexOf('(');
          if (result) result = NFA.parseExp(str.slice(j+1, i), alphabet).star().concatenation(result);
          else result = NFA.parseExp(str.slice(j+1, i), alphabet).star();
          i = j;
        } else throw str[i];
      } else throw str[i];
    }
    return result;
  }

  toString() {
    let result = "";
    for(let i in this.transition) {
      if (i==this.startState) result += "^";
      result += `${this.finalStates.includes(i)?"!"+i:i}\n`;
      for(let j in this.transition[i]) {
        if (this.transition[i][j].length != 0) {
          result += `| ${j==""?"''":j} -> [${this.transition[i][j]}]\n`;
        }
      }
    }
    return result;
  }

  _equivalence(states) {
    const visited = {};
    const stack = [];
    const result = [];
    for(let i in states) {
      stack.push(states[i]);
      result.push(states[i]);
      visited[states[i]] = true;
    }
    while (stack.length) {
      const q = stack.pop();
      for (let i in this.transition[q][""]) {
        const e = this.transition[q][""][i];
        if(!visited[e]) {
          stack.push(e);
          result.push(e);
          visited[e] = true;
        }
      }
    }
    return result;
  }

  computate(states, input, log = false) {
    states = this._equivalence(states);
    for (let i in input) {
      const a = input[i];
      const result = this._equivalence([...new Set(states.reduce((arr, q) => {
        return (arr.concat(this.transition[q][a]));
      }, []))]);
      if (log) console.log(`([${states}],${a}) -> [${result}]`); 
      states = result;
    }
    return states;
  }

  isAccept(input, log = false) { 
    if (log) console.log(input);
    return this.computate([this.startState], input, log).some(q => this.finalStates.includes(q));
  }

  complement() {
    return NFA.fromDFA(DFA.fromNFA(this).complement());
  }
  
  intersection(nfa) {
    return NFA.fromDFA(DFA.fromNFA(this).intersection(DFA.fromNFA(nfa)));
  }

  union(nfa) {
    const states = [
      `(${this.startState}+${nfa.startState})`, 
      ...this.states.map(e=>`${e}0`).concat(nfa.states.map(e=>`${e}1`))
    ];
    const symbols = this.symbols;
    const transition = {};
    for(let i in this.transition) {
      transition[`${i}0`] = JSON.parse(JSON.stringify(this.transition[i]));
      for(let j in transition[`${i}0`]) {
        transition[`${i}0`][j] = transition[`${i}0`][j].map(e=>`${e}0`);
      }
    }
    for(let i in nfa.transition) {
      transition[`${i}1`] = JSON.parse(JSON.stringify(nfa.transition[i]));
      for(let j in transition[`${i}1`]) {
        transition[`${i}1`][j] = transition[`${i}1`][j].map(e=>`${e}1`);
      }
    }
    transition[`(${this.startState}+${nfa.startState})`] = {};
    for(let i in symbols) {
      transition[`(${this.startState}+${nfa.startState})`][symbols[i]] = [];
    }
    transition[`(${this.startState}+${nfa.startState})`][''] = [`${this.startState}0`, `${nfa.startState}1`];
    const startState = `(${this.startState}+${nfa.startState})`;
    const finalStates = [...this.finalStates.map(e=>`${e}0`), ...nfa.finalStates.map(e=>`${e}1`)];
    return new NFA(states, symbols, transition, startState, finalStates);
  }

  difference(nfa) {
    return this.union(nfa.complement());
  }

  concatenation(nfa) {
    const states = this.states.map(e=>`${e}0`).concat(nfa.states.map(e=>`${e}1`));
    const symbols = this.symbols;
    const transition = {};
    for(let i in this.transition) {
      transition[`${i}0`] = JSON.parse(JSON.stringify(this.transition[i]));
      for(let j in transition[`${i}0`]) {
        transition[`${i}0`][j] = transition[`${i}0`][j].map(e=>`${e}0`);
      }
    }
    for(let i in nfa.transition) {
      transition[`${i}1`] = JSON.parse(JSON.stringify(nfa.transition[i]));
      for(let j in transition[`${i}1`]) {
        transition[`${i}1`][j] = transition[`${i}1`][j].map(e=>`${e}1`);
      }
    }
    for(let i in this.finalStates) {
      transition[`${this.finalStates[i]}0`][''].push(`${nfa.startState}1`);
    }
    const startState = `${this.startState}0`;
    const finalStates = nfa.finalStates.map(e=>`${e}1`);
    return new NFA(states, symbols, transition, startState, finalStates);
  }

  star() {
    const states = [`${this.startState}*`,...this.states];
    const symbols = this.symbols;
    const transition = JSON.parse(JSON.stringify(this.transition));
    transition[`${this.startState}*`] = {};
    for(let i in symbols) {
      transition[`${this.startState}*`][symbols[i]] = [];
    }
    transition[`${this.startState}*`][''] = [this.startState];
    for(let i in this.finalStates) {
      transition[this.finalStates[i]][''].push(`${this.startState}*`);
    }
    const startState = `${this.startState}*`;
    const finalStates = [`${this.startState}*`, ...this.finalStates];
    return new NFA(states, symbols, transition, startState, finalStates);
  }
}

// Ends with 01
const nfa1 = new NFA(['a', 'b', 'c'],
                  ['0', '1'],
                  {'a' : {'0' : ['a', 'b'], '1' : ['a'], [""]: []},
                   'b' : {'0' : [], '1' : ['c'], [""]: []},
                   'c' : {'0' : [], '1' : [], [""]: []}},
                  'a',
                  ['c']);

// Ends with 01 or 10
const nfa2 = new NFA(['a', 'b', 'c', 'e', 'f', 'g'],
                  ['0', '1'],
                  {'a' : {'0' : ['a'], '1' : ['a'], [""]: ['b', 'e']},
                   'b' : {'0' : ['c'], '1' : [], [""]: []},
                   'c' : {'0' : [], '1' : ['d'], [""]: []},
                   'd' : {'0' : [], '1' : [], [""]: []},
                   'e' : {'0' : [], '1' : ['f'], [""]: []},
                   'f' : {'0' : ['g'], '1' : [], [""]: []},
                   'g' : {'0' : [], '1' : [], [""]: []}},
                  'a',
                  ['d', 'g']);

// Substring 01
const dfa1 = new DFA(['a', 'b', 'c'],
                   ['0', '1'],
                   {'a' : {'0' : 'b', '1' : 'a'},
                    'b' : {'0' : 'b', '1' : 'c'},
                    'c' : {'0' : 'c', '1' : 'c'}},
                   'a',
                   ['c']);

// Odd number of 1s
const dfa2 = new DFA(['d', 'e'],
                   ['0', '1'],
                   {'d' : {'0' : 'd', '1' : 'e'},
                    'e' : {'0' : 'e', '1' : 'd'}},
                   'd',
                   ['e']);

const grey = NFA.parseExp('gr(e|a)y|red');
console.log(grey.toString());
console.log(grey.isAccept("grey", true));
console.log(grey.isAccept("red", true));
console.log(grey.isAccept("gray", true));
console.log(grey.isAccept("black", true));
