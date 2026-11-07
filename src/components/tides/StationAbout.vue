<template>
  <DashboardCard :title="$t('tides.about.title')">
    <p data-lead class="text-sm leading-[21px] [text-wrap:pretty]">
      {{ $t(`tides.about.leads.${station.tideType}`, { name: station.name }) }}
    </p>
    <dl class="flex flex-col">
      <div
        v-for="fact in facts"
        :key="fact.key"
        data-fact
        class="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-t py-2.5 text-sm leading-5"
      >
        <dt class="text-muted-foreground">{{ $t(`tides.about.${fact.key}`) }}</dt>
        <dd class="text-right font-medium tabular-nums">{{ fact.value }}</dd>
      </div>
    </dl>
    <div class="flex flex-col gap-1 border-t pt-2.5 text-xs leading-[18px] text-muted-foreground">
      <span class="text-sm leading-5">{{ $t('tides.about.source') }}</span>
      <TideCredit data-attribution :text="attribution" class="[overflow-wrap:anywhere]" />
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import TideCredit from '@/components/tides/TideCredit.vue'
import tideMixin from '@/mixins/tideMixin'

export default {
  name: 'StationAbout',
  components: { DashboardCard, TideCredit },
  mixins: [tideMixin],
  props: {
    station: { type: Object, required: true },
    /** the station's own notice, with its licence: tides.credit.attribution */
    attribution: { type: String, required: true }
  },
  computed: {
    position() {
      const { lat, lon } = this.station
      return this.$t('tides.about.positionValue', {
        lat: this.tideDecimal(Math.abs(lat), 2),
        ns: this.$t(lat >= 0 ? 'tides.about.n' : 'tides.about.s'),
        lon: this.tideDecimal(Math.abs(lon), 2),
        ew: this.$t(lon >= 0 ? 'tides.about.e' : 'tides.about.w')
      })
    },
    facts() {
      const s = this.station
      const range = (metres) => `${this.tideShort(metres)} ${this.tideUnit}`
      const data = [s.source, s.license].filter(Boolean).join(' · ')
      return [
        { key: 'tideType', value: this.$t(`tides.about.types.${s.tideType}`) },
        s.meanRange !== null && { key: 'averageRange', value: range(s.meanRange) },
        s.springRange !== null && { key: 'springRange', value: range(s.springRange) },
        { key: 'largestRange', value: range(s.largestRange) },
        { key: 'heightsFrom', value: s.datum },
        { key: 'position', value: this.position },
        { key: 'data', value: data },
        s.record && { key: 'record', value: s.record.map((year) => this.tideDecimal(Number(year), 0)).join('–') }
      ].filter(Boolean)
    }
  }
}
</script>
