<template>
  <div
    class="grid"
    :class="row ? 'gap-4 border-t pt-4 md:grid-cols-7 lg:grid-cols-4 xl:grid-cols-7' : 'grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4'"
  >
    <!-- row:   the strip at the foot of the Current card (md+)
         tiles: the phone Details card, Air Quality spans 2 at base
         Padding is offset by a negative margin, so the hover background grows outwards
         and the text stays on the grid. -->
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      aria-haspopup="dialog"
      :aria-label="item.aria"
      :title="item.title"
      :disabled="item.disabled"
      @click="open(item.key, $event)"
      class="flex min-w-0 flex-col gap-1 rounded-lg text-left outline-ring transition-colors duration-[120ms] ease-linear focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 enabled:hover:bg-foreground/5 enabled:active:bg-foreground/[0.09]"
      :class="[
        row ? '-mx-2 -my-1.5 px-2 py-1.5' : '-mx-3 -my-2.5 px-3 py-2.5',
        { 'col-span-2 sm:col-span-1': !row && item.key === 'airQuality' }
      ]"
    >
      <span class="w-full truncate text-[13px] font-medium leading-4 text-muted-foreground">{{ item.label }}</span>
      <span class="flex w-full min-w-0 items-center gap-[5px]">
        <svg
          v-if="item.key === 'wind' && item.degree !== undefined"
          viewBox="0 0 24 24"
          aria-hidden="true"
          class="size-[13px] flex-none text-chart-wind"
          :style="{ transform: `rotate(${item.degree + 180}deg)` }"
        >
          <path d="M12 3 L19 21 L12 16.5 L5 21 Z" fill="currentColor" />
        </svg>
        <span
          v-if="item.dot"
          aria-hidden="true"
          class="size-2.5 flex-none rounded-full shadow-[inset_0_0_0_1px_hsl(var(--foreground)/0.12)]"
          :style="{ background: item.dot }"
        />
        <!-- prettier-ignore -->
        <span
          class="min-w-0 truncate leading-6 tabular-nums"
          :class="[
            row ? 'text-[17px]' : 'text-xl',
            item.dim ? 'font-normal text-muted-foreground' : 'font-medium'
          ]"
        >{{ item.value }}{{ item.unit ? ' ' : '' }}<span v-if="item.unit" class="text-[13px] font-normal text-muted-foreground">{{ item.unit }}</span></span>
      </span>
    </button>

    <!-- portalled, so it adds nothing to the grid -->
    <DetailModalShell
      :value="selected?.key ?? null"
      :opener="selected?.opener"
      max-width-class="max-w-[520px]"
      history-key="tidyDetail"
      @close="selected = null"
    >
      <template #default="{ value }">
        <ConditionDetailContent :detail="value" />
      </template>
    </DetailModalShell>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import DetailModalShell from '@/components/common/DetailModalShell.vue'
import ConditionDetailContent from '@/components/weather/ConditionDetailContent.vue'
import useUnitStore from '@/stores/unit'
import useWeatherStore from '@/stores/weather'
import weatherMixin from '@/mixins/weatherMixin'
import { epaCategory, readings } from '@/utils/conditionDetail'

const MISSING = '—'

export default {
  name: 'WeatherDetails',
  components: { ConditionDetailContent, DetailModalShell },
  mixins: [weatherMixin],
  props: {
    variant: { type: String, default: 'row', validator: (v) => ['row', 'tiles'].includes(v) }
  },
  data() {
    return {
      // { key, opener }; each instance owns its modal, and only the visible one is clickable
      selected: null
    }
  },
  computed: {
    ...mapState(useWeatherStore, ['current', 'forecast']),
    ...mapState(useUnitStore, ['unit']),
    row() {
      return this.variant === 'row'
    },
    items() {
      const current = this.current
      const day = this.forecast?.[0]?.day
      const ready = !!(current && day)
      const r = ready ? readings(current, day, this.unit) : {}
      const number = (v) => (typeof v === 'number' ? this.formatNumber(v) : MISSING)
      const units = (key) => (ready ? this.$t(`hourly.detail.units.${key}`) : '')
      const uvKnown = ready && typeof current.uv === 'number'
      const epa = ready ? epaCategory(current.air_quality?.['us-epa-index']) : null
      const speedUnit = ready ? this.$t(`hourly.${r.speedUnit}`) : ''

      const items = [
        { key: 'humidity', label: this.$t('weather.humidity'), value: ready ? `${number(current.humidity)}%` : MISSING },
        {
          key: 'wind',
          label: this.$t('weather.wind'),
          value: number(r.speed),
          unit: speedUnit,
          degree: current?.wind_degree,
          title: ready ? this.$t('conditionDetail.tileTitles.wind', { dir: current.wind_dir }) : undefined
        },
        {
          key: 'precip',
          label: this.$t('weather.precipitation'),
          value: number(r.precip),
          unit: units(r.precipUnit),
          title: this.$t('conditionDetail.tileTitles.precip')
        },
        { key: 'visibility', label: this.$t('weather.visibility'), value: number(r.visibility), unit: units(r.visibilityUnit) },
        { key: 'pressure', label: this.$t('weather.pressure'), value: number(r.pressure), unit: units(r.pressureUnit) },
        {
          key: 'uv',
          label: this.$t('weather.uv'),
          value: uvKnown ? number(Math.round(current.uv)) : MISSING,
          dim: !uvKnown,
          disabled: !uvKnown,
          title: uvKnown ? this.$t('conditionDetail.tileTitles.uv') : this.$t('weather.uvUnavailable')
        },
        {
          key: 'airQuality',
          label: this.$t('weather.airQuality'),
          value: epa ? this.$t(`conditionDetail.airQuality.short.${epa.key}`) : MISSING,
          dot: epa?.color,
          dim: !epa,
          disabled: !epa,
          title: epa ? this.$t('conditionDetail.tileTitles.airQuality', { name: this.$t(`conditionDetail.airQuality.names.${epa.key}`) }) : undefined,
          // "Air quality: Moderate", not the title and value both saying it
          aria: epa
            ? this.$t('conditionDetail.openLabel', {
                title: this.$t('conditionDetail.airQuality.title'),
                value: this.$t(`conditionDetail.airQuality.names.${epa.key}`)
              })
            : undefined
        }
      ]

      return items.map((item) => {
        const title = item.title ?? item.label
        const value = item.unit ? `${item.value} ${item.unit}` : item.value
        return {
          ...item,
          title,
          aria: item.aria ?? this.$t('conditionDetail.openLabel', { title, value }),
          disabled: !ready || !!item.disabled
        }
      })
    }
  },
  methods: {
    open(key, event) {
      this.selected = { key, opener: event.currentTarget }
    }
  }
}
</script>
