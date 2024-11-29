<script>
  import { userUuid } from "../stores/stores.js";
  import { assignmentOrder } from "../stores/stores.js";
  import { userPoints } from "../stores/stores.js";

  let ws;
  let code = "";
  let status = "";
  let feedback = "";
  let correct = false;

  const getAssignment = async () => {
    const response = await fetch(`/api/assignment/${$assignmentOrder}`);
    if (response.status == 404) {
      return null;
    }
    return await response.json();
  };
  
  let assignmentPromise = getAssignment();

  const gradeAssignment = async () => {
    if (code.length == 0) {
      return;
    }

    status = "Grading pending";
    feedback = "";

    const response = await fetch("/api/grade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: $userUuid, assignmentOrder: $assignmentOrder, code: code }),
    });

    const responseData = await response.json();

    if (responseData.result) {
      status = responseData.status;
      feedback = responseData.result;
      correct = feedback.includes("OK");

      if (correct) {
        $assignmentOrder = String(Number($assignmentOrder) + 1);
        $userPoints = String(Number($userPoints) + 100);
      }
    } else {
      const host = window.location.hostname;
      ws = new WebSocket("ws://" + host + `:7800/grader-api/ws?submissionId=${responseData.submissionId}`);

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        status = message.status;

        if (message.result) {
          ws.close();
          feedback = message.result;
          correct = feedback.includes("OK");

          const confirmation = await fetch("/api/update", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ submissionId: message.submissionId, feedback: feedback, correct: correct }),
          });

          if (correct) {
            $assignmentOrder = String(Number($assignmentOrder) + 1);
            $userPoints = String(Number($userPoints) + 100);
          }
        }
      };
    }
  };

  const nextAssignment = () => {
    code = "";
    status = "";
    feedback = "";
    correct = false;
    assignmentPromise = getAssignment();
  };
</script>

{#await assignmentPromise}
  <p class="text-gray-700 font-serif">Loading assignment...</p>
{:then assignment}
  {#if assignment === null}
    <p class="text-gray-700 font-serif">No assignments available.</p>
  {:else}
    <h1 id="title" class="text-2xl text-gray-700 font-serif">Assignment {assignment.assignment_order}: {assignment.title}</h1>
    <p id="description" class="text-gray-700 font-serif mt-2 mb-4">{assignment.handout}.</p>

    <label for="code" class="text-gray-700 font-serif mb-1">Your code:</label>
    <br>
    <textarea id="code" rows="4" bind:value={code} class="border border-black rounded w-3/5"/>
    <br>
      
    {#if status == ""}
      <button
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold font-serif p-4 rounded mt-4"
        on:click={gradeAssignment}>
        Grade
      </button>
    {:else}
      <p id="status" class="text-gray-700 font-serif">Status: {status}</p>
      {#if feedback != ""}
        {#if correct}
          <p class="text-gray-700 font-serif">Feedback:</p>
          <pre id="feedback" class="text-green-700 font-serif">{feedback}</pre>
          <button
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold font-serif p-4 rounded mt-4"
            on:click={nextAssignment}>
            Next assignment
          </button>
        {:else}
          <p class="text-gray-700 font-serif">Feedback:</p>
          <pre id="feedback" class="text-red-700 font-serif">{feedback}</pre>
          <button
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold font-serif p-4 rounded mt-4"
            on:click={gradeAssignment}>
            Grade again
          </button>
        {/if}
      {/if}
    {/if}
{/if}
{/await}