-- MySQL migration for maintenance checklists created independently of tasks.
ALTER TABLE checklist_instancias
  MODIFY COLUMN id_tarea INT NULL,
  ADD COLUMN id_activo INT NULL,
  ADD COLUMN id_usuario INT NULL,
  ADD COLUMN fecha_programada DATE NULL,
  ADD COLUMN observaciones VARCHAR(2000) NULL,
  ADD INDEX ix_checklist_instancias_id_activo (id_activo),
  ADD INDEX ix_checklist_instancias_id_usuario (id_usuario),
  ADD INDEX ix_checklist_instancias_fecha_programada (fecha_programada),
  ADD CONSTRAINT fk_checklist_instancias_activo FOREIGN KEY (id_activo) REFERENCES activos(id),
  ADD CONSTRAINT fk_checklist_instancias_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id);
