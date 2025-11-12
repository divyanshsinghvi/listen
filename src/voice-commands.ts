/**
 * voice-commands.ts
 *
 * Voice command processor for Listen
 * Handles spoken commands like "period", "comma", "new line", etc.
 */

export interface VoiceCommand {
  trigger: string[];  // Possible spoken forms
  action: (text: string) => string;  // Text transformation
  description: string;
}

export class VoiceCommandProcessor {
  private commands: VoiceCommand[] = [];
  private enabled: boolean = true;

  constructor() {
    this.registerDefaultCommands();
  }

  private registerDefaultCommands() {
    // Punctuation commands
    this.register({
      trigger: ['period', 'full stop', 'dot'],
      action: (text) => text + '.',
      description: 'Insert period'
    });

    this.register({
      trigger: ['comma'],
      action: (text) => text + ',',
      description: 'Insert comma'
    });

    this.register({
      trigger: ['question mark'],
      action: (text) => text + '?',
      description: 'Insert question mark'
    });

    this.register({
      trigger: ['exclamation mark', 'exclamation point'],
      action: (text) => text + '!',
      description: 'Insert exclamation mark'
    });

    this.register({
      trigger: ['colon'],
      action: (text) => text + ':',
      description: 'Insert colon'
    });

    this.register({
      trigger: ['semicolon'],
      action: (text) => text + ';',
      description: 'Insert semicolon'
    });

    // Line/paragraph commands
    this.register({
      trigger: ['new line', 'newline'],
      action: (text) => text + '\n',
      description: 'Insert new line'
    });

    this.register({
      trigger: ['new paragraph', 'paragraph'],
      action: (text) => text + '\n\n',
      description: 'Start new paragraph'
    });

    // Formatting commands
    this.register({
      trigger: ['all caps on', 'caps on', 'capitalize on'],
      action: (text) => text + ' [[CAPS_ON]]',
      description: 'Enable all caps mode'
    });

    this.register({
      trigger: ['all caps off', 'caps off', 'capitalize off'],
      action: (text) => text + ' [[CAPS_OFF]]',
      description: 'Disable all caps mode'
    });

    // Deletion commands
    this.register({
      trigger: ['delete that', 'scratch that', 'undo'],
      action: (text) => {
        // Remove last sentence or word
        const sentences = text.split(/[.!?]\s*/);
        if (sentences.length > 1) {
          sentences.pop();
          return sentences.join('. ') + '.';
        }
        return '';
      },
      description: 'Delete last sentence'
    });

    this.register({
      trigger: ['delete last word'],
      action: (text) => {
        const words = text.trim().split(/\s+/);
        words.pop();
        return words.join(' ');
      },
      description: 'Delete last word'
    });

    // Special characters
    this.register({
      trigger: ['at sign', 'at symbol'],
      action: (text) => text + '@',
      description: 'Insert @ symbol'
    });

    this.register({
      trigger: ['hashtag', 'hash', 'pound sign'],
      action: (text) => text + '#',
      description: 'Insert # symbol'
    });

    this.register({
      trigger: ['dollar sign'],
      action: (text) => text + '$',
      description: 'Insert $ symbol'
    });

    // Quote marks
    this.register({
      trigger: ['open quote', 'begin quote'],
      action: (text) => text + '"',
      description: 'Insert opening quote'
    });

    this.register({
      trigger: ['close quote', 'end quote'],
      action: (text) => text + '"',
      description: 'Insert closing quote'
    });

    // Number formatting
    this.register({
      trigger: ['numeral', 'number mode on'],
      action: (text) => text + ' [[NUM_ON]]',
      description: 'Convert words to numbers'
    });

    this.register({
      trigger: ['number mode off'],
      action: (text) => text + ' [[NUM_OFF]]',
      description: 'Stop converting to numbers'
    });
  }

  register(command: VoiceCommand) {
    this.commands.push(command);
  }

  process(transcription: string): string {
    if (!this.enabled) return transcription;

    let processed = transcription;
    let capsMode = false;

    // Split into words while preserving spaces
    const words = processed.split(/\b/);
    const result: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase().trim();
      let matched = false;

      // Check if word/phrase matches a command
      for (const command of this.commands) {
        for (const trigger of command.trigger) {
          // Check for multi-word commands
          const triggerWords = trigger.split(' ');

          if (triggerWords.length === 1) {
            if (word === trigger) {
              const currentText = result.join('');
              const newText = command.action(currentText);
              result.length = 0;
              result.push(newText);
              matched = true;
              break;
            }
          } else {
            // Multi-word command
            const phrase = words.slice(i, i + triggerWords.length).join('').toLowerCase();
            if (phrase === trigger) {
              const currentText = result.join('');
              const newText = command.action(currentText);
              result.length = 0;
              result.push(newText);
              i += triggerWords.length - 1;  // Skip ahead
              matched = true;
              break;
            }
          }
        }
        if (matched) break;
      }

      if (!matched) {
        // Apply caps mode if active
        if (capsMode && /\w/.test(word)) {
          result.push(word.toUpperCase());
        } else {
          result.push(words[i]);  // Keep original (with spacing)
        }
      }

      // Check for mode toggles
      if (word.includes('[[caps_on]]')) capsMode = true;
      if (word.includes('[[caps_off]]')) capsMode = false;
    }

    // Clean up mode markers
    processed = result.join('')
      .replace(/\[\[CAPS_ON\]\]/g, '')
      .replace(/\[\[CAPS_OFF\]\]/g, '')
      .replace(/\[\[NUM_ON\]\]/g, '')
      .replace(/\[\[NUM_OFF\]\]/g, '');

    // Clean up multiple spaces
    processed = processed.replace(/\s+/g, ' ').trim();

    return processed;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getCommands(): VoiceCommand[] {
    return this.commands;
  }
}

// Number word conversion
export class NumberConverter {
  private static wordToNumber: { [key: string]: number } = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
    'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
    'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
    'hundred': 100, 'thousand': 1000, 'million': 1000000
  };

  static convertNumberWords(text: string): string {
    // Find number word sequences and convert to digits
    // E.g., "twenty three" -> "23"
    const words = text.split(/\s+/);
    const result: string[] = [];
    let i = 0;

    while (i < words.length) {
      const word = words[i].toLowerCase();

      if (word in this.wordToNumber) {
        let number = 0;
        let current = 0;

        while (i < words.length && words[i].toLowerCase() in this.wordToNumber) {
          const value = this.wordToNumber[words[i].toLowerCase()];

          if (value >= 100) {
            current *= value;
            number += current;
            current = 0;
          } else {
            current += value;
          }

          i++;
        }

        number += current;
        result.push(number.toString());
      } else {
        result.push(words[i]);
        i++;
      }
    }

    return result.join(' ');
  }
}
