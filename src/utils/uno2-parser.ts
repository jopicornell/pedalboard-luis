import {Bank} from "../types/Bank";

import {pascalCase} from "change-case";
import {Button} from "../types/Button";

function getButtonParsing(button: Button) {
    if (button.type === "effect" && !button.invert) {
        return `EFFECT_ON ${button.name} = SendMidi ${button.channel} CtrlChange ${button.controller} 127
EFFECT_OFF ${button.name} = SendMidi ${button.channel} CtrlChange ${button.controller} 0`;
    }

    if (button.type === "effect" && button.invert) {
        return `EFFECT_OFF ${button.name} = SendMidi ${button.channel} CtrlChange ${button.controller} 127
EFFECT_ON ${button.name} = SendMidi ${button.channel} CtrlChange ${button.controller} 0`;
    }
    if (button.type === "trigger") {
        return `TRIGGER_CLICK ${button.name} = SendMidi ${button.channel} CtrlChange ${button.controller} 127`;
    }
    if (button.type === "program" && !button.messages) {
        return `PRESET ${button.name} = SendMidi ${button.channel} ProgChange ${button.controller}`;
    }

    if (button.type === "program" && button.messages) {
        let presetText = `PRESET ${button.name} = \n{\n`;
        presetText += `SendMidi ${button.channel} ProgChange ${button.controller}\n`
        for (const message of button.messages) {
            if (message.type === "controlchange") {
                presetText += `\tSendMidi ${message.channel} CtrlChange ${message.dataBytes[0]} ${message.dataBytes[1]}\n`
            }
            if (message.type === "programchange") {
                presetText += `SendMidi ${message.channel} ProgChange ${message.dataBytes[0]}\n`
            }
        }
        presetText += `}\n`
        return presetText
    }
    return button
}

export function banksToUno2(banks: Bank[]): string {
    let uno2program = '';
    const channels = Array.from(new Set(banks.flatMap(bank => bank.buttons.map(button => button.channel))));
    const bankButtons = banks.flatMap(bank => bank.buttons);
    const buttonsWithoutRepeated = bankButtons
        .filter(
            (button, index) => bankButtons
                .findIndex(b => b.controller === button.controller && b.name === button.name && button.channel === b.channel) === index
        );
    const presets = Array.from(new Set(bankButtons.filter(button => button.type === 'program').map(button => button.name)));
    const effects = Array.from(new Set(bankButtons.filter(button => button.type === 'effect').map(button => button.name)));
    const triggers = Array.from(new Set(bankButtons.filter(button => button.type === 'trigger' || button.type === 'returnToPreviousBank').map(button => button.name)));
    uno2program += `PRESETS = \n{\n\t${presets.join('\n\t')}\n}\n\n`;
    uno2program += `EFFECTS = \n{\n\t${effects.join('\n\t')}\n}\n\n`;
    uno2program += `TRIGGERS = \n{\n\t${triggers.join('\n\t')}\n}\n\n`;
    if (banks.some(bank => bank.name === 'Direct Bank')) {
        uno2program += 'USE_DIRECT_BANK\n\n'
    }
    uno2program += `BANKS = \n{\n\t${banks.map(bank => `${bank.name}: ${bank.buttons.map(button => button.name).join(' | ')}`).join('\n\t')}\n}\n\n`;

    for (const channel of channels) {
        uno2program += `CHANNEL ${channel} = ${channel}\n`
    }
    uno2program += 'CHANNEL 15 = 15\n\n';
    uno2program += 'REMOTE_CONTROL_CHANNEL = 16\n\n';

    banks.forEach((bank, index) => {
        uno2program += `INIT_BANK ${bank.name} = \n{\n\tSendMidi 15 ProgChange ${index} \n}\n\n`;
    })

    for (const button of buttonsWithoutRepeated) {
        uno2program += `${getButtonParsing(button)}\n`;
    }

    return uno2program;
}
