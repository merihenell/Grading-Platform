<script>
  import { userUuid } from "../stores/stores.js";
  import { userPoints } from "../stores/stores.js";
</script>

<nav class="p-4 mb-4 shadow flex justify-between">
  <span class="text-2xl text-gray-700 font-serif">Hello {$userUuid}!</span>
  <span id="points" class="text-2xl text-gray-700 font-serif">Points: {$userPoints}</span>
</nav>