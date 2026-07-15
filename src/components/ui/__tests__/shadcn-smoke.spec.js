import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))
}

describe('shadcn-vue components', () => {
  it('renders Button with variants', () => {
    const wrapper = mount(Button, {
      props: { variant: 'outline', size: 'sm' },
      slots: { default: 'Click me' }
    })
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('border')
  })

  it('renders Badge', () => {
    const wrapper = mount(Badge, { slots: { default: 'New' } })
    expect(wrapper.text()).toBe('New')
  })

  it('renders Card with all sections', () => {
    const wrapper = mount({
      components: { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle },
      template: `
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      `
    })
    expect(wrapper.text()).toContain('Title')
    expect(wrapper.text()).toContain('Content')
    expect(wrapper.text()).toContain('Footer')
  })

  it('renders Input and binds v-model', async () => {
    const wrapper = mount({
      components: { Input },
      data: () => ({ value: '' }),
      template: '<Input v-model="value" />'
    })
    await wrapper.find('input').setValue('Dhaka')
    expect(wrapper.vm.value).toBe('Dhaka')
  })

  it('renders Label', () => {
    const wrapper = mount(Label, { slots: { default: 'City' } })
    expect(wrapper.text()).toBe('City')
  })

  it('renders Separator', () => {
    const wrapper = mount(Separator)
    expect(wrapper.attributes('data-orientation')).toBe('horizontal')
  })

  it('renders Skeleton', () => {
    const wrapper = mount(Skeleton)
    expect(wrapper.classes()).toContain('animate-pulse')
  })

  it('renders Switch and toggles', async () => {
    const wrapper = mount({
      components: { Switch },
      data: () => ({ on: false }),
      template: '<Switch v-model="on" />'
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.vm.on).toBe(true)
  })

  it('renders Select trigger', () => {
    const wrapper = mount({
      components: { Select, SelectContent, SelectItem, SelectTrigger, SelectValue },
      template: `
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="c">Celsius</SelectItem>
            <SelectItem value="f">Fahrenheit</SelectItem>
          </SelectContent>
        </Select>
      `
    })
    expect(wrapper.text()).toContain('Unit')
  })

  it('renders Dialog trigger', () => {
    const wrapper = mount({
      components: { Dialog, DialogTrigger },
      template: `
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
        </Dialog>
      `
    })
    expect(wrapper.text()).toContain('Open')
  })

  it('renders DropdownMenu trigger', () => {
    const wrapper = mount({
      components: { DropdownMenu, DropdownMenuTrigger },
      template: `
        <DropdownMenu>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        </DropdownMenu>
      `
    })
    expect(wrapper.text()).toContain('Menu')
  })

  it('renders Tooltip trigger', () => {
    const wrapper = mount({
      components: { Tooltip, TooltipProvider, TooltipTrigger },
      template: `
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover</TooltipTrigger>
          </Tooltip>
        </TooltipProvider>
      `
    })
    expect(wrapper.text()).toContain('Hover')
  })
})
