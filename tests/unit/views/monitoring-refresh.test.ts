import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, KeepAlive, nextTick, ref } from "vue";
import { useMonitoringRefresh } from "@/views/system/gateway/monitoring/refresh";

describe("monitoring automatic refresh", () => {
  afterEach(() => vi.useRealTimers());

  function setup(load = vi.fn(async () => {}), enabled = ref(true)) {
    let refresh!: ReturnType<typeof useMonitoringRefresh>;
    const wrapper = mount(
      defineComponent({
        setup() {
          refresh = useMonitoringRefresh(load, enabled);
          return () => h("div");
        },
      })
    );
    return { wrapper, refresh, load, enabled };
  }

  it("defaults to 30 seconds, changes frequency, supports disabling and manual refresh", async () => {
    vi.useFakeTimers();
    const { wrapper, refresh, load } = setup();
    await vi.advanceTimersByTimeAsync(29_999);
    expect(load).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(load).toHaveBeenCalledTimes(1);
    refresh.refreshInterval.value = 10_000;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(load).toHaveBeenCalledTimes(2);
    refresh.refreshInterval.value = 60_000;
    await vi.advanceTimersByTimeAsync(59_999);
    expect(load).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(load).toHaveBeenCalledTimes(3);
    refresh.refreshInterval.value = 0;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(load).toHaveBeenCalledTimes(3);
    await refresh.refresh();
    expect(load).toHaveBeenCalledTimes(4);
    wrapper.unmount();
  });

  it("stops when the detail closes and on unmount", async () => {
    vi.useFakeTimers();
    const { wrapper, load, enabled } = setup(undefined, ref(false));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(load).not.toHaveBeenCalled();
    enabled.value = true;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(load).toHaveBeenCalledTimes(1);
    enabled.value = false;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(load).toHaveBeenCalledTimes(1);
    enabled.value = true;
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("waits for slow requests and recovers after failure", async () => {
    vi.useFakeTimers();
    let reject!: (reason: Error) => void;
    const load = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((_, fail) => {
            reject = fail;
          })
      )
      .mockResolvedValue(undefined);
    const { wrapper, refresh } = setup(load);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(refresh.refreshing.value).toBe(true);
    await vi.advanceTimersByTimeAsync(60_000);
    await refresh.refresh();
    expect(load).toHaveBeenCalledTimes(1);
    reject(new Error("Unavailable"));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(load).toHaveBeenCalledTimes(2);
    expect(refresh.refreshing.value).toBe(false);
    wrapper.unmount();
  });

  it("pauses cached pages when navigating away and resumes on return", async () => {
    vi.useFakeTimers();
    const visible = ref(true);
    const load = vi.fn(async () => {});
    const page = defineComponent({
      setup() {
        useMonitoringRefresh(load);
        return () => h("div");
      },
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () => h(KeepAlive, () => (visible.value ? h(page) : null)),
      })
    );
    await vi.advanceTimersByTimeAsync(30_000);
    expect(load).toHaveBeenCalledTimes(1);
    visible.value = false;
    await nextTick();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(load).toHaveBeenCalledTimes(1);
    visible.value = true;
    await nextTick();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(load).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });
});
