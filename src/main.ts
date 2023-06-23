import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import {router} from "./router/routes";

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import specific icons */
import { faBars, faGrip, faCog, faVialCircleCheck, faClipboard } from '@fortawesome/free-solid-svg-icons'

/* add icons to the library */
library.add(faBars, faGrip, faCog, faVialCircleCheck, faClipboard)

createApp(App)
  .use(router)
  .mount('#app')
