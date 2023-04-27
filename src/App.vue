<template>
  <!-- <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header> -->
  <!-- <RouterView /> -->
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
          <button type="submit"><img src="./assets/icons/arrow-right.svg" alt="" /></button>
        </form>
      </div>
      <button>
        <img src="./assets/icons/gps-location.svg" alt="" class="p-2" />
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
  <!-- home -->
  <div class="w-4/5 mx-auto border border-black">
    <!-- weather-info -->
    <div class="w-[40rem] h-auto border border-black">
      <!-- basic-info -->
      <div class="flex-column w-45 border border-black">
        <!-- location-time -->
        <div class="w-full flex flex-row justify-between items-end">
          <div class="w-fit">
            <p class="text-gray-500">Current Location</p>
            <p class="text-slate-800 font-medium text-2xl">Dhaka, Bangladesh</p>
          </div>
          <div class="w-fit">
            <p class="text-gray-500">Thursday, Apr 20</p>
          </div>
        </div>
        <!-- info -->
        <div class="w-full h-80 mt-3 drop-shadow-xl bg-white rounded-3xl">
          <!-- top -->
          <div class="flex flex-row items-center justify-center border border-black">
            <div class="flex flex-col">
              <div class="flex flex-row items-end mr-5">
                <div class="text-8xl font-normal pr-5">27°</div>
                <div>
                  <p class="mb-2 font-normal text-2xl">Haze</p>
                  <p>Feels like 29°</p>
                </div>
              </div>
              <div>asdasda</div>
            </div>
            <div class="border border-black">
              <img class="w-40" src="./assets/icons/weather-icon.svg" alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- forecast -->
    <div></div>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>
