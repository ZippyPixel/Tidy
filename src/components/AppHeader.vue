<template>
  <!-- header -->
  <div
    class="w-full h-20 fixed top-0 bg-white/70 backdrop-blur-lg z-10 flex flex-row justify-around items-center drop-shadow-lg"
  >
    <!-- title -->
    <div>
      <p class="font-semibold text-4xl text-slate-800 tracking-[0.5em]">TIDY</p>
    </div>

    <!-- search -->
    <div class="w-1/4 flex flex-row items-center">
      <div class="w-full bg-gray-200 p-2 rounded-lg">
        <form action="" class="content-start flex items-stretch">
          <input
            type="text"
            class="bg-inherit w-full focus:outline-none text-xl pl-2"
            placeholder="Search City"
          />
          <button type="submit"><img src="../assets/icons/arrow-right.svg" alt="" /></button>
        </form>
      </div>
      <button>
        <img src="../assets/icons/gps-location.svg" alt="" class="p-2" />
      </button>
    </div>

    <!-- unit select -->
    <div>
      <select name="unit" id="unit" class="p-2 rounded-md">
        <option value="celsius">Celsius</option>
        <option value="fahrenheit">Fahrenheit</option>
      </select>
    </div>
  </div>
  <div class="mt-20 pb-10"></div>
</template>

<script>
export default {
  name: 'AppHeader'
}
</script>
