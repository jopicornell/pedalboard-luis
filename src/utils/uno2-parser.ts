import {Bank} from '../types/Bank';

import {Button, ButtonWithController} from '../types/Button';
import {MidiMessage, MidiMessageType} from "../types/MidiMessage";
import {Sweep} from "../types/Sweep";

function getMidiMessageParsing(message: MidiMessage): string | '' {
    if (message.type === MidiMessageType.ControlChange) {
        return `SendMidi ${message.channel} CtrlChange ${message.controller} ${message.value}`
    }
    if (message.type === MidiMessageType.NoteOn) {
        return `SendMidi ${message.channel} NoteOn ${message.controller} ${message.value}`
    }
    if (message.type === MidiMessageType.NoteOff) {
        return `SendMidi ${message.channel} NoteOff ${message.controller} ${message.value}`
    }
    if (message.type === MidiMessageType.ProgramChange) {
        return `SendMidi ${message.channel} ProgChange ${message.controller}`
    }
    return '';
}

function getButtonParsing(button: Button): string {
    let parsing = ''
    if (button.type === 'effect') {
        parsing += `EFFECT_ON ${button.name} = {
            SendMidi ${button.channel} CtrlChange ${button.controller} 127
        `
        if (button.sweeps) {
            parsing += button.sweeps.map(sweep => `Pedal ${sweep.pedal} = ${sweep.name}`).join('\n');
        }
        parsing += '\n}\n';
        parsing += `EFFECT_OFF ${button.name} = {
    SendMidi ${button.channel} CtrlChange ${button.controller} 0
}`;
    }

    if (button.type === 'trigger') {
        parsing += `TRIGGER_CLICK ${button.name} = SendMidi ${button.channel} CtrlChange ${button.controller} 127\n`;
        parsing += `TRIGGER_RELEASE ${button.name} = SendMidi ${button.channel} CtrlChange ${button.controller} 0`;
    }

    if (button.type === 'program') {
        parsing += `PRESET ${button.name} = SendMidi ${button.channel} ProgChange ${button.controller}`;
    }

    return parsing
}

function getSweepParsing(sweep: Sweep): string {
    return `SendMidi ${sweep.channel} CtrlChange ${sweep.controller} ${sweep.min}-${sweep.max} ${sweep.curve === 'linear' ? '' : sweep.curve}`;
}

export function banksToUno2(banks: Bank[]): string {
    let uno2program = '';
    // randomize button names
    const parsedBanks = banks.map(bank => {
        return {
            ...bank,
            buttons: bank.buttons.map(button => {
                return {
                    ...button,
                    name: button.name + ' ' + Math.random().toString(36).slice(4)
                }
            })
        }
    })
    const channels = Array.from(
        new Set(
            parsedBanks.flatMap(bank =>
                bank.buttons
                    .map(button => "channel" in button ? button.channel : null)
            )
                .filter(channel => channel !== null)
        )
    );
    const bankButtons: ButtonWithController[] = parsedBanks
        .flatMap(bank => (bank.buttons))
        .filter(button => button.type !== 'returnToPreviousBank' && button.type !== 'goToDirectBank')
        .map(button => button as ButtonWithController);
    const buttonsWithoutRepeated = bankButtons
        .filter(
            (button, index) => bankButtons
                .findIndex(b => b.controller === button.controller && b.name === button.name && button.channel === b.channel) === index
        );
    const sweeps = buttonsWithoutRepeated
        .flatMap(button => button.sweeps || [])
        .filter((sweep, index, sweeps) => sweeps.findIndex(s => s.controller === sweep.controller && s.channel === sweep.channel) === index);

    const pressetNames = Array.from(new Set(
        bankButtons.filter(button => button.type === 'program')
            .map(button => button.name)
    ));
    const effectNames = Array.from(new Set(
        bankButtons.filter(button => button.type === 'effect')
            .map(button => button.name)
    ));
    const triggerNames = Array.from(new Set(
        bankButtons.filter(button => button.type === 'trigger')
            .map(button => button.name)
    ));
    const sweepNames = Array.from(new Set(
        bankButtons.filter(button => button.sweeps)
            .flatMap(button =>
                button.sweeps?.map(sweep => sweep.name) || []
            )
    ));

    uno2program += `PRESETS = \n{\n\t${pressetNames.join('\n\t')}\n}\n\n`;
    uno2program += `EFFECTS = \n{\n\t${effectNames.join('\n\t')}\n}\n\n`;
    uno2program += `TRIGGERS = \n{\n\t${triggerNames.join('\n\t')}\n}\n\n`;
    uno2program += `SWEEPS = \n{\n\t${sweepNames.join('\n\t')}\n}\n\n`;

    if (parsedBanks.some(bank => bank.name === 'Direct Bank')) {
        uno2program += 'USE_DIRECT_BANK\n\n'
    }
    uno2program += `BANKS = \n{\n\t${parsedBanks.map(bank => `${bank.name}: ${bank.buttons.map(button => button.name).join(' | ')}`).join('\n\t')}\n}\n\n`;

    console.log(parsedBanks, parsedBanks.map(bank => `${bank.name}: ${bank.buttons.map(button => button.name).join(' | ')}`))
    for (const channel of channels) {
        uno2program += `CHANNEL ${channel} = ${channel}\n`
    }
    uno2program += 'CHANNEL 15 = 15\n\n';
    uno2program += 'REMOTE_CONTROL_CHANNEL = 16\n\n';

    parsedBanks.forEach((bank, index) => {
        uno2program += `INIT_BANK ${bank.name} = \n{\n\tSendMidi 15 ProgChange ${index} \n}\n\n`;
    })

    for (const sweep of sweeps) {
        uno2program += `SWEEP ${sweep.name} = ${getSweepParsing(sweep)}\n`;
    }

    for (const button of buttonsWithoutRepeated) {
        uno2program += `${getButtonParsing(button)}\n`;
    }

    console.log(uno2program)

    return uno2program;
}
