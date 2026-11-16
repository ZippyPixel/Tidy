// Where each Sun & Moon card sits ("Tidy Sun Moon Responsive", section 04). Source order is
// the phone order; md–lg is two columns of 6, xl puts the chart beside "Where to look" and
// three columns of 4 under it. The skeleton uses the same classes.
export const SKY_GRID = 'grid grid-cols-12 items-stretch gap-4 md:gap-6'

export const SKY_PLACE = {
  bar: 'col-span-12',
  chart: 'col-span-12 md:col-start-1 md:row-start-2 xl:col-span-8',
  look: 'col-span-12 md:col-span-6 md:col-start-1 md:row-start-3 xl:col-span-4 xl:col-start-9 xl:row-start-2',
  sun: 'col-span-12 md:col-span-6 md:col-start-1 md:row-start-4 xl:col-span-4 xl:row-start-3',
  moon: 'col-span-12 md:col-span-6 md:col-start-7 md:row-start-4 xl:col-span-4 xl:col-start-5 xl:row-start-3',
  geo: 'col-span-12 md:col-span-6 md:col-start-7 md:row-start-3 xl:col-span-4 xl:col-start-9 xl:row-start-3',
  prayer: 'col-span-12 md:col-span-6 md:col-start-1 md:row-start-5 xl:col-span-4 xl:row-start-4',
  planet:
    'col-span-12 md:col-span-6 md:col-start-7 md:row-start-5 xl:col-span-4 xl:col-start-5 xl:row-start-4',
  ahead: 'col-span-12 md:col-start-1 md:row-start-6 xl:col-span-4 xl:col-start-9 xl:row-start-4'
}
