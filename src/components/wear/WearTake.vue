<template>
  <DashboardCard :title="$t('wear.page.takeWithYou')" :busy="loading" class="self-stretch">
    <!-- design/TidyWear "Take with you" -->
    <template v-if="!loading">
      <ul
        v-if="rec.carry.length"
        class="m-0 flex list-none flex-col gap-2.5 p-0"
        :class="fadeClass"
      >
        <li v-for="c in rec.carry" :key="c.id" class="flex items-center gap-3" data-wear-carry>
          <span
            class="flex size-10 flex-none items-center justify-center rounded-full bg-accent text-accent-foreground"
          >
            <WearIcon :d="icon(c.id)" :size="20" />
          </span>
          <div class="flex min-w-0 flex-col">
            <span class="text-[15px] font-semibold leading-5">{{ text(c.name) }}</span>
            <span class="text-[13px] leading-[18px] tabular-nums text-muted-foreground">
              {{ text(c.why) }}
            </span>
          </div>
        </li>
      </ul>
      <p v-else class="m-0 text-sm leading-5 text-muted-foreground" :class="fadeClass">
        {{ $t('wear.page.nothingExtra') }}
      </p>
    </template>
    <div v-else class="flex flex-col gap-2.5">
      <div v-for="k in 2" :key="k" class="flex items-center gap-3">
        <Skeleton class="size-10 flex-none rounded-full" />
        <div class="flex flex-1 flex-col gap-2">
          <Skeleton class="h-3.5 w-[40%]" />
          <Skeleton class="h-3 w-[64%]" />
        </div>
      </div>
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { WEAR_ICONS } from '@/constants/wear'
import WearIcon from './WearIcon.vue'

export default {
  name: 'WearTake',
  components: { DashboardCard, Skeleton, WearIcon },
  props: {
    rec: { type: Object, default: null },
    loading: { type: Boolean, default: false },
    fadeClass: { type: String, default: '' },
    text: { type: Function, required: true }
  },
  methods: {
    icon(id) {
      return WEAR_ICONS[id] || WEAR_ICONS.layer
    }
  }
}
</script>
