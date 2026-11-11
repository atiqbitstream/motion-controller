/* hello_motion: the smallest complete Motion Controller game loop in C.
 *
 *   hello_motion <action-map.json> <licence.entitlement.json> [seconds]
 *
 * It connects to the installed Motion Controller Runtime, presents your game's licence, opens a session with your action
 * map, and prints every action for a few seconds. The app id comes from the action map's "appId", which must be the app id
 * your licence was issued for. Build (macOS / Linux):
 *
 *   cc -std=c11 -Iinclude hello_motion.c lib/libmotionctl.a -o hello_motion
 *
 * Windows, from a Visual Studio x64 developer prompt (motionctl.dll beside the program):
 *
 *   cl /std:c11 /Iinclude hello_motion.c lib\motionctl.lib
 */
#include "motionctl.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#ifdef _WIN32
#include <windows.h>
static void nap_ms(unsigned ms) { Sleep(ms); }
#else
#include <time.h>
static void nap_ms(unsigned ms) { struct timespec t = { ms / 1000, (long)(ms % 1000) * 1000000L }; nanosleep(&t, NULL); }
#endif

static char *slurp(const char *path, size_t *len) {
  FILE *f = fopen(path, "rb");
  if (!f) return NULL;
  fseek(f, 0, SEEK_END);
  long n = ftell(f);
  fseek(f, 0, SEEK_SET);
  char *b = malloc((size_t)n + 1);
  if (b && fread(b, 1, (size_t)n, f) != (size_t)n) { free(b); b = NULL; }
  fclose(f);
  if (b) { b[n] = 0; if (len) *len = (size_t)n; }
  return b;
}

/* The action map's "appId" value (a small scan: enough for a well-formed map). */
static int app_id_of(const char *map, char *out, size_t cap) {
  const char *k = strstr(map, "\"appId\"");
  if (!k) return 0;
  const char *q = strchr(k + 7, '"');
  if (!q) return 0;
  const char *e = strchr(q + 1, '"');
  if (!e || (size_t)(e - q - 1) >= cap) return 0;
  memcpy(out, q + 1, (size_t)(e - q - 1));
  out[e - q - 1] = 0;
  return 1;
}

int main(int argc, char **argv) {
  if (argc < 3) { fprintf(stderr, "usage: %s <action-map.json> <licence.entitlement.json> [seconds]\n", argv[0]); return 2; }
  int seconds = argc > 3 ? atoi(argv[3]) : 10;
  char *map = slurp(argv[1], NULL);
  size_t ent_len = 0;
  char *ent = slurp(argv[2], &ent_len);
  if (!map) { fprintf(stderr, "cannot read the action map %s\n", argv[1]); return 2; }
  if (!ent) { fprintf(stderr, "cannot read the licence %s\n", argv[2]); return 2; }
  char app_id[128];
  if (!app_id_of(map, app_id, sizeof app_id)) { fprintf(stderr, "the action map has no \"appId\"\n"); return 2; }

  printf("libmotionctl %s, app %s\n", mc_version(), app_id);
  mc_config cfg = { .app_id = app_id, .client_name = "hello_motion/1.0", .entitlement = (const uint8_t *)ent, .entitlement_len = ent_len };
  mc_client *c = NULL;
  if (mc_create(&cfg, &c) != MC_OK) { fprintf(stderr, "mc_create failed\n"); return 1; }
  mc_status s = mc_connect(c, 5000);
  if (s != MC_OK) {
    printf("connect: %s: %s\n(install the runtime: %s)\n", mc_status_name(s), mc_last_error(c), mc_install_url());
    mc_close(c);
    return 1;
  }
  printf("connect: MC_OK (the runtime proved itself and accepted the licence)\n");
  mc_session_opts o = { .action_map_json = map };
  s = mc_open_session(c, &o);
  if (s != MC_OK) { printf("session: %s: %s\n", mc_status_name(s), mc_last_error(c)); mc_close(c); return 1; }
  printf("session: open\n");

  unsigned events = 0, performed = 0;
  for (int frame = 0; frame < seconds * 60; frame++) {
    mc_event ev[256];
    uint32_t n = 0;
    s = mc_drain_events(c, ev, 256, &n);
    if (s != MC_OK && n == 0) { printf("drain: %s: %s\n", mc_status_name(s), mc_last_error(c)); break; }
    for (uint32_t i = 0; i < n; i++) {
      events++;
      if (ev[i].family == MC_FAMILY_ACTION && ev[i].phase == MC_PHASE_PERFORMED) {
        performed++;
        printf("  action: %s\n", ev[i].name);
      }
    }
    nap_ms(16);
  }
  mc_state_snapshot st;
  if (mc_state(c, &st) == MC_OK) printf("state: tracking %u, %.1f fps%s%s\n", st.tracking_state, st.fps, st.advice[0] ? ", advice: " : "", st.advice);
  printf("events: %u (actions performed: %u) in %d s\n", events, performed, seconds);
  mc_close(c);
  free(map);
  free(ent);
  return 0;
}
