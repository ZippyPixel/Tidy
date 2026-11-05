<template>
  <div class="flex flex-col text-base">
    <!-- Settings rows, shared by the phone bottom sheet and the md+ popover.
         Rows are 56px tap targets; the whole row toggles its setting. -->
    <div
      class="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-[var(--radius)] pl-3 pr-2 hover:bg-foreground/[0.06]"
      @click="toggleTheme"
    >
      <span :id="themeLabelId">{{ $t('header.darkMode') }}</span>
      <UiSwitch
        :model-value="isDark"
        :aria-labelledby="themeLabelId"
        class="h-8 w-[52px] border-0 shadow-none data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted data-[state=unchecked]:shadow-[inset_0_0_0_2px_hsl(var(--muted-foreground))]"
        thumb-class="shadow-none data-[state=checked]:size-6 data-[state=unchecked]:size-4 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-2 data-[state=checked]:bg-primary-foreground data-[state=unchecked]:bg-muted-foreground"
        @click.stop
        @update:model-value="toggleTheme"
      />
    </div>
    <div class="flex min-h-14 items-center justify-between gap-4 rounded-[var(--radius)] pl-3 pr-2">
      <span>{{ $t('header.temperature') }}</span>
      <UnitToggle />
    </div>
    <button
      type="button"
      class="flex min-h-14 items-center justify-between gap-4 rounded-[var(--radius)] pl-3 pr-2 text-left hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      :title="$t('header.switchLanguage')"
      @click="toggleLocale"
    >
      <span>{{ $t('header.language') }}</span>
      <span class="flex items-center gap-2">
        <AppIcon name="languages" :size="18" />
        {{ $t('languageName') }}
        <AppIcon name="chevron-right" :size="18" class="text-muted-foreground" />
      </span>
    </button>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import useThemeStore from '@/stores/theme'
import useLocaleStore from '@/stores/locale'
import AppIcon from '@/components/common/AppIcon.vue'
import UnitToggle from '@/components/ui/UnitToggle.vue'
import { useId } from 'vue'
import { Switch } from '@/components/ui/switch'

export default {
  name: 'SettingsPanel',
  components: { AppIcon, UnitToggle, UiSwitch: Switch },
  setup() {
    return { themeLabelId: useId() }
  },
  computed: {
    ...mapState(useThemeStore, ['isDark'])
  },
  methods: {
    ...mapActions(useThemeStore, ['toggleTheme']),
    ...mapActions(useLocaleStore, ['toggleLocale'])
  }
}
</script>
