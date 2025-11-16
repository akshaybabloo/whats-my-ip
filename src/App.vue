<script setup lang="ts">
import type { ICountryData } from 'countries-list'
import { onMounted, ref, watch } from 'vue'

// Extend Window interface for AdSense
declare global {
    interface Window {
        adsbygoogle: any[]
    }
}

interface IpInfo {
    ip: string
    country: string
    info?: ICountryData | string
}

const ipData = ref<IpInfo | undefined>(undefined)
const isDark = ref(false)

const getIP = async () => {
    ipData.value = undefined
    const res = await fetch('/api/ip')
    ipData.value = await res.json()
}

const setTheme = (dark: boolean) => {
    const html = document.querySelector('html')
    if (dark) {
        html?.setAttribute('data-theme', 'dark')
    } else {
        html?.setAttribute('data-theme', 'light')
    }
    localStorage.setItem('darkMode', dark.toString())
}

onMounted(() => {
    getIP()

    // Load dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
        isDark.value = savedDarkMode === 'true'
    }

    // Set initial theme
    setTheme(isDark.value)

    // Initialize Google AdSense
    try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
        console.error('AdSense error:', e)
    }
})

watch(isDark, (newVal) => {
    setTheme(newVal)
})
</script>

<template>
    <main class="flex min-h-screen flex-col items-center justify-center bg-base-300 p-4">
        <div class="card w-96 bg-base-100 shadow-sm">
            <div class="card-body">
                <div class="flex justify-between">
                    <h2 class="text-2xl font-bold">Your IP</h2>
                    <span class="text-xl">
                        <label class="toggle text-base-content">
                            <input type="checkbox" v-model="isDark" />
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="fill-white">
                                <!--Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.!-->
                                <path
                                    d="M320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576C388.8 576 451.3 548.8 497.3 504.6C504.6 497.6 506.7 486.7 502.6 477.5C498.5 468.3 488.9 462.6 478.8 463.4C473.9 463.8 469 464 464 464C362.4 464 280 381.6 280 280C280 207.9 321.5 145.4 382.1 115.2C391.2 110.7 396.4 100.9 395.2 90.8C394 80.7 386.6 72.5 376.7 70.3C358.4 66.2 339.4 64 320 64z"
                                />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="fill-black">
                                <!--Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.!-->
                                <path
                                    d="M210.2 53.9C217.6 50.8 226 51.7 232.7 56.1L320.5 114.3L408.3 56.1C415 51.7 423.4 50.9 430.8 53.9C438.2 56.9 443.4 63.5 445 71.3L465.9 174.5L569.1 195.4C576.9 197 583.5 202.4 586.5 209.7C589.5 217 588.7 225.5 584.3 232.2L526.1 320L584.3 407.8C588.7 414.5 589.5 422.9 586.5 430.3C583.5 437.7 576.9 443.1 569.1 444.6L465.8 465.4L445 568.7C443.4 576.5 438 583.1 430.7 586.1C423.4 589.1 414.9 588.3 408.2 583.9L320.4 525.7L232.6 583.9C225.9 588.3 217.5 589.1 210.1 586.1C202.7 583.1 197.3 576.5 195.8 568.7L175 465.4L71.7 444.5C63.9 442.9 57.3 437.5 54.3 430.2C51.3 422.9 52.1 414.4 56.5 407.7L114.7 320L56.5 232.2C52.1 225.5 51.3 217.1 54.3 209.7C57.3 202.3 63.9 196.9 71.7 195.4L175 174.6L195.9 71.3C197.5 63.5 202.9 56.9 210.2 53.9zM239.6 320C239.6 275.6 275.6 239.6 320 239.6C364.4 239.6 400.4 275.6 400.4 320C400.4 364.4 364.4 400.4 320 400.4C275.6 400.4 239.6 364.4 239.6 320zM448.4 320C448.4 249.1 390.9 191.6 320 191.6C249.1 191.6 191.6 249.1 191.6 320C191.6 390.9 249.1 448.4 320 448.4C390.9 448.4 448.4 390.9 448.4 320z"
                                />
                            </svg>
                        </label>
                    </span>
                </div>
                <ul class="mt-6 flex flex-col gap-1 text-3xl font-extrabold text-center" v-if="!ipData">
                    <li>
                        <span><span class="loading loading-spinner loading-md"></span></span>
                    </li>
                </ul>

                <ul class="mt-6 flex flex-col gap-1 text-3xl font-extrabold text-center" v-else>
                    <li>
                        <span>{{ ipData?.ip }}</span>
                    </li>
                    <li>
                        <span>{{ ipData?.country }}</span>
                    </li>
                </ul>

                <div class="mt-6">
                    <button class="btn btn-primary btn-block" @click="getIP">Refresh</button>
                </div>
            </div>
        </div>

        <!-- Google AdSense Display Ad -->
        <div class="mt-4 w-96 max-w-full">
            <ins
                class="adsbygoogle"
                style="display:block"
                data-ad-client="ca-pub-7450383714878520"
                data-ad-slot="5212548826"
                data-ad-format="auto"
                data-full-width-responsive="true"
            ></ins>
        </div>
    </main>
    <footer class="fixed bottom-2 left-0 right-0 text-center text-sm text-gray-500">
        <p>
            Made with
            <span class="mx-1 inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" class="inline-block h-4 w-4 fill-red-600" viewBox="0 0 640 640">
                    <!--Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.!-->
                    <path
                        d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z"
                    />
                </svg>
            </span>
            by
            <a
                href="https://gollahalli.com"
                class="mx-1 underline underline-offset-4 decoration-dotted hover:text-gray-300 transition duration-150 ease-out hover:ease-in"
                >Akshay Raj Gollahalli
            </a>
        </p>
    </footer>
</template>
