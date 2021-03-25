import ComponentsBuilder from "./components.js"
import { constants } from "./constants.js"


export default class TerminalController {
    #usersCollors = new Map()

    constructor() { }


    #pickCollor() {
        return `#${((1 << 24) * Math.random() | 0).toString(16)}-fg`
    }

    #getUserCollor(userName) {
        if (this.#usersCollors.has(userName))
            return this.#usersCollors.get(userName)

        const collor = this.#pickCollor()
        this.#usersCollors.set(userName, collor)

        return collor
    }

    #onInputReceived(eventEmitter) {
        return function () {
            const message = this.getValue()
            console.log(message)
            this.clearValue()
        }
    }

    #onMessageReceived({ screen, chat }) {
        return msg => {
            const { userName, message } = msg
            const collor = this.#getUserCollor(userName)

            chat.addItem(`{${collor}}{bold}${userName}{/}: ${message}`)

            screen.render() //atualizar tela
        }
    }

    #onLogChanged({ screen, activityLog }) {

        return msg => {
            // bachiari left
            // bachiari join

            const [userName] = msg.split(/\s/) //expressão regular em tudo que for espaço
            const collor = this.#getUserCollor(userName)
            activityLog.addItem(`{${collor}}{bold}${msg.toString()}{/}`)

            screen.render()
        }
    }
    #onStatusChanged({ screen, status }) {

        // [ 'bachiari', 'mariazinha']
        return users => {

            // vamos pegar o primeiro elemento da lista
            const { content } = status.items.shift()
            status.clearItems()
            status.addItem(content)

            users.forEach(userName => {
                const collor = this.#getUserCollor(userName)
                status.addItem(`{${collor}}{bold}${userName}{/}`)
            })

            screen.render()
        }
    }
    #registerEvents(eventEmitter, components) {
        eventEmitter.on(constants.events.app.MESSAGE_RECEIVED, this.#onMessageReceived(components)) //posso passar o objeto inteiro do components e ele irá extrair somente o que ele precisa
        eventEmitter.on(constants.events.app.ACTIVITYLOG_UPDATED, this.#onLogChanged(components))
        eventEmitter.on(constants.events.app.STATUS_UPDATED, this.#onStatusChanged(components))

    }
    async initializeTable(eventEmitter) {
        const components = new ComponentsBuilder()
            .setScreen({ title: 'HackerChat - Erick Wendel' })
            .setLayoutComponent()
            .setInputComponent(this.#onInputReceived(eventEmitter))
            .setChatComponent()
            .setActivityLogComponent()
            .setStatusComponent()
            .build()

        this.#registerEvents(eventEmitter, components) //registrando os eventos pra quando o 'message:received' chamar a função onMessageReceived colocar a mensagem no chat, e em seguida renderizar

        components.input.focus()
        components.screen.render()

        // setInterval(() => {
        //     eventEmitter.emit('message:received', { message: 'hey', userName: 'bachiari' })
        //     eventEmitter.emit('message:received', { message: 'hey', userName: 'jhow' })
        //     eventEmitter.emit('message:received', { message: 'hey', userName: 'maria' })
        // })
    }
}