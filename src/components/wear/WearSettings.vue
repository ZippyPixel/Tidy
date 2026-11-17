<template>
  <section
    :aria-labelledby="titleId"
    class="flex min-w-0 flex-col gap-4 rounded-card border bg-card p-4 text-card-foreground sm:p-6"
  >
    <!-- design/TidyWear "Fit it to you": figure, style, how warm you run, more coverage, and
         dresses and skirts for the woman figure. Saved in the tidy-wear cookie, shared with the dashboard card. -->
    <div class="flex flex-wrap items-baseline justify-between gap-3">
      <h2 :id="titleId" class="m-0 text-sm font-medium leading-6 text-muted-foreground">
        {{ $t('wear.page.fit') }}
      </h2>
      <span class="text-[13px] text-muted-foreground">{{ $t('wear.page.saved') }}</span>
    </div>
    <div class="grid grid-cols-1 gap-x-10 lg:grid-cols-2">
      <div :class="row" class="flex-wrap">
        <div :class="label">
          <span class="text-[15px] font-semibold leading-5">{{ $t('wear.page.figure') }}</span>
          <span :class="sub">{{ $t('wear.page.figureSub') }}</span>
        </div>
        <SegmentedControl
          kind="radio"
          :aria-label="$t('wear.page.figure')"
          :options="figureOptions"
          :model-value="wear.figure"
          @update:model-value="wear.set('figure', $event)"
        />
      </div>
      <div :class="row" class="flex-wrap">
        <div :class="label">
          <span class="text-[15px] font-semibold leading-5">{{ $t('wear.page.style') }}</span>
          <span :class="sub">{{ $t('wear.page.styleSub') }}</span>
        </div>
        <SegmentedControl
          kind="radio"
          :aria-label="$t('wear.page.style')"
          :options="styleOptions"
          :model-value="wear.style"
          data-wear-style
          @update:model-value="wear.set('style', $event)"
        />
      </div>
      <div :class="row" class="flex-wrap">
        <div :class="label">
          <span class="text-[15px] font-semibold leading-5">{{ $t('wear.page.feel') }}</span>
          <span :class="sub">{{ $t('wear.page.feelSub') }}</span>
        </div>
        <SegmentedControl
          kind="radio"
          :aria-label="$t('wear.page.feel')"
          :options="feelOptions"
          :model-value="String(wear.feel)"
          data-wear-feel
          @update:model-value="wear.set('feel', Number($event))"
        />
      </div>
      <div v-for="s in switches" :key="s.key" :class="row">
        <div :class="label">
          <span :id="`${titleId}-${s.key}`" class="text-[15px] font-semibold leading-5">{{
            $t(`wear.page.${s.key}`)
          }}</span>
          <span :class="sub">{{ $t(`wear.page.${s.key}Sub`) }}</span>
        </div>
        <UiSwitch
          :model-value="wear[s.key]"
          :aria-labelledby="`${titleId}-${s.key}`"
          class="h-8 w-[52px] flex-none border-0 shadow-none data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted data-[state=unchecked]:shadow-[inset_0_0_0_2px_hsl(var(--muted-foreground))]"
          thumb-class="shadow-none data-[state=checked]:size-6 data-[state=unchecked]:size-4 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-2 data-[state=checked]:bg-primary-foreground data-[state=unchecked]:bg-muted-foreground"
          :data-wear-switch="s.key"
          @update:model-value="wear.set(s.key, $event)"
        />
      </div>
    </div>
  </section>
</template>

<script>
import { useId } from 'vue'
import SegmentedControl from '@/components/common/SegmentedControl.vue'
import { Switch } from '@/components/ui/switch'
import useWearStore from '@/stores/wear'
import { WEAR_STYLES } from '@/utils/preferences'

export default {
  name: 'WearSettings',
  components: { SegmentedControl, UiSwitch: Switch },
  setup() {
    return { titleId: useId(), wear: useWearStore() }
  },
  data() {
    return {
      row: 'flex items-center justify-between gap-4 border-t py-3',
      label: 'flex min-w-0 flex-col gap-0.5',
      sub: 'text-[13px] leading-[18px] text-muted-foreground'
    }
  },
  computed: {
    figureOptions() {
      return ['man', 'woman'].map((value) => ({ value, label: this.$t(`wear.page.${value}`) }))
    },
    styleOptions() {
      return WEAR_STYLES.map((value) => ({ value, label: this.$t(`wear.page.${value}`) }))
    },
    feelOptions() {
      return [
        ['-1', 'colder'],
        ['0', 'normal'],
        ['1', 'warmer']
      ].map(([value, k]) => ({ value, label: this.$t(`wear.page.${k}`) }))
    },
    switches() {
      const list = [{ key: 'coverage' }]
      if (this.wear.figure === 'woman') list.push({ key: 'skirts' })
      return list
    }
  }
}
</script>
